// =============================================================================
// Sync engine. Reconciles every local table (engine.ts) with its Postgres
// counterpart whenever there's a connection. Per table, in order:
//
//   1. PUSH queued upserts  → Supabase upsert, then clear the local flag.
//   2. PUSH queued deletes  → Supabase delete, then drop the local tombstone.
//   3. PULL the full table  → last-write-wins merge into the local store.
//
// Push-before-pull means our own changes are on the server before we pull, so
// the pull's "deleted elsewhere" detection never removes a row we just created.
// The tables are tiny, so a full pull every sync is simpler than tracking a
// server-side watermark and is plenty fast.
// =============================================================================
import { supabase } from '../supabase';
import { ALL_SPECS, type TableSpec } from './specs';
import * as engine from './engine';

/** A synced row always carries at least these; app columns vary by table. */
type SyncedRow = { id: string; updated_at: string } & Record<string, unknown>;

// ─── Status ──────────────────────────────────────────────────────────────────

/** A table's place in the current run. */
export type TableSyncState = 'pending' | 'pulling' | 'done';

/** What a screen can tell about syncing: whether a run is on, how far it has
 *  got, and when this device last brought everything down. */
export interface SyncStatus {
  syncing: boolean;
  /** Each table's place in the current run, by table name. */
  tables: Readonly<Record<string, TableSyncState>>;
  /** The documents' files fetched so far in this run, of those this device
   *  lacked; null until that part of the run starts. */
  files: { done: number; total: number } | null;
  /** When a run last went through whole on this device — every table and
   *  every file — as an ISO timestamp; null until one has. */
  completedAt: string | null;
}

/** localStorage key of the time the last whole run ended on this device. */
const SYNC_COMPLETED_AT_KEY = 'daico.syncCompletedAt';

// Storage may be absent (tests) or refuse (a storage policy); either reads as
// "never", and the status in memory still carries the stamp for the session.
function readCompletedAt(): string | null {
  try {
    return localStorage.getItem(SYNC_COMPLETED_AT_KEY);
  } catch {
    return null;
  }
}

function writeCompletedAt(iso: string | null): void {
  try {
    if (iso === null) localStorage.removeItem(SYNC_COMPLETED_AT_KEY);
    else localStorage.setItem(SYNC_COMPLETED_AT_KEY, iso);
  } catch {
    // Kept in memory only.
  }
}

let status: SyncStatus = {
  syncing: false,
  tables: {},
  files: null,
  completedAt: readCompletedAt(),
};
const statusListeners = new Set<() => void>();

function setStatus(patch: Partial<SyncStatus>): void {
  status = { ...status, ...patch };
  statusListeners.forEach((listener) => listener());
}

function setTable(table: string, state: TableSyncState): void {
  setStatus({ tables: { ...status.tables, [table]: state } });
}

/** The sync status right now, for code outside React. */
export function getSyncStatus(): SyncStatus {
  return status;
}

/** Run `listener` on every change of the sync status; returns the unsubscribe. */
export function subscribeSyncStatus(listener: () => void): () => void {
  statusListeners.add(listener);
  return () => {
    statusListeners.delete(listener);
  };
}

/** Note how far the documents' files have got in this run. For the file sync. */
export function reportFiles(done: number, total: number): void {
  setStatus({ files: { done, total } });
}

/** Forget that this device ever completed a run — for when its data is wiped. */
export function resetSyncStatus(): void {
  writeCompletedAt(null);
  setStatus({ tables: {}, files: null, completedAt: null });
}

// ─── Runs ────────────────────────────────────────────────────────────────────

// Serialize syncs; if one is requested while another runs, run exactly one more
// afterwards so the latest local changes always get a chance to push.
let syncing = false;
let rerun = false;

// Work that belongs to a sync but lives beside the tables — files in a storage
// bucket — runs once every table has had its turn, so it sees the pulled rows.
const afterSyncListeners = new Set<() => Promise<void>>();

/** Run `listener` at the end of every sync run; returns the unsubscribe. */
export function afterSync(listener: () => Promise<void>): () => void {
  afterSyncListeners.add(listener);
  return () => {
    afterSyncListeners.delete(listener);
  };
}

/** Best-effort sync of all tables. Never throws — pending changes simply stay
 *  queued for a later attempt. */
export async function syncAll(): Promise<void> {
  if (!navigator.onLine) return;
  if (syncing) {
    rerun = true;
    return;
  }
  syncing = true;
  setStatus({
    syncing: true,
    tables: Object.fromEntries(ALL_SPECS.map((spec) => [spec.table, 'pending'])),
    files: null,
  });
  // The run counts as whole only if its last pass over the tables and every
  // listener went through: then this device holds everything there is.
  let whole = true;
  try {
    do {
      rerun = false;
      whole = true;
      for (const spec of ALL_SPECS) {
        setTable(spec.table, 'pulling');
        try {
          await syncTable(spec);
          setTable(spec.table, 'done');
        } catch (err) {
          // Network blip, expired token, a column the server doesn't have yet…
          // Queued changes stay put; we retry on the next trigger (online
          // event, app focus, or the next user action). Caught per table so
          // one table that keeps failing doesn't block the rest.
          whole = false;
          setTable(spec.table, 'pending');
          console.warn(`[offline] sync of ${spec.table} failed, will retry later:`, err);
        }
      }
    } while (rerun && navigator.onLine);
    for (const listener of afterSyncListeners) {
      try {
        await listener();
      } catch (err) {
        // Same contract as a table: whatever it left undone waits for the next run.
        whole = false;
        console.warn('[offline] after-sync work failed, will retry later:', err);
      }
    }
    if (whole) {
      const completedAt = new Date().toISOString();
      writeCompletedAt(completedAt);
      setStatus({ completedAt });
    }
  } finally {
    syncing = false;
    setStatus({ syncing: false });
  }
}

async function syncTable(spec: TableSpec): Promise<void> {
  // 1. Queued creates/updates — the objects are already in server shape.
  for (const row of await engine.getPendingUpserts<SyncedRow>(spec)) {
    const { error } = await supabase.from(spec.table).upsert(row);
    if (error) throw error;
    await engine.markUpserted(spec, row.id, row.updated_at);
  }

  // 2. Queued deletes (unconditional — "delete wins" under last-write-wins).
  for (const id of await engine.getPendingDeletes(spec)) {
    const { error } = await supabase.from(spec.table).delete().eq('id', id);
    if (error) throw error;
    await engine.markDeleted(spec, id);
  }

  // 3. Full pull + reconcile. The table name is dynamic, so supabase-js can't
  // infer a row type — cast the plain rows we asked for.
  const columns = ['id', ...spec.columns.map((c) => c.name), 'created_at', 'updated_at'].join(', ');
  const { data, error } = await supabase.from(spec.table).select(columns);
  if (error) throw error;
  await engine.reconcile(spec, (data ?? []) as unknown as Record<string, unknown>[]);
}
