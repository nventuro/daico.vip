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
import { isPermanentRowError } from '../refusals';
import { ALL_SPECS, columnNames, type TableSpec } from './specs';
import * as engine from './engine';

/** How recently (ms) a sync run must have ended for a screen that opens not
 *  to ask for another: moving around the app must not sync at every tap. */
export const SYNC_FRESH_MS = 60_000;

/** How many rows a sync asks the server for at a time. PostgREST answers a
 *  plain select with at most 1000 rows and says nothing about the rest, so a
 *  table is read page by page until one comes back short. */
export const SYNC_PULL_PAGE = 1000;

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
  lastRunAt = null;
  setStatus({ tables: {}, files: null, completedAt: null });
}

// ─── Runs ────────────────────────────────────────────────────────────────────

// Serialize syncs; if one is requested while another runs, run exactly one more
// afterwards so the latest local changes always get a chance to push.
let syncing = false;
let rerun = false;
// When the last run ended, whatever came of it; null until one has.
let lastRunAt: number | null = null;

/** Work that belongs to a sync but lives beside the tables — files in a
 *  storage bucket. It is told which tables came down in the run, so it never
 *  acts on rows it has not seen. */
export type AfterSyncListener = (synced: ReadonlySet<string>) => Promise<void>;

// Runs once every table has had its turn, so it sees the pulled rows.
const afterSyncListeners = new Set<AfterSyncListener>();

/** Run `listener` at the end of every sync run; returns the unsubscribe. */
export function afterSync(listener: AfterSyncListener): () => void {
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
  // The tables the last pass brought down, for the work that follows them.
  let synced = new Set<string>();
  try {
    do {
      rerun = false;
      whole = true;
      synced = new Set<string>();
      for (const spec of ALL_SPECS) {
        setTable(spec.table, 'pulling');
        try {
          await syncTable(spec);
          synced.add(spec.table);
          setTable(spec.table, 'done');
        } catch (err) {
          // Network blip, expired token, a column the server doesn't have yet…
          // Queued changes stay put; we retry on the next trigger (online
          // event, app focus, or the next user action). Caught per table so
          // one table that keeps failing doesn't block the rest.
          whole = false;
          setTable(spec.table, 'pending');
          console.warn(`[offline] sync of ${spec.table} failed, will retry later:`, describe(err));
        }
      }
    } while (rerun && navigator.onLine);
    for (const listener of afterSyncListeners) {
      try {
        await listener(synced);
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
    lastRunAt = Date.now();
    syncing = false;
    setStatus({ syncing: false });
  }
}

/**
 * Ask for a run whenever the device is likely to want one: the connection is
 * back, or the app is in front again after being away (you reopen it once
 * signal is back). Installed once for the whole app, so that N screens
 * watching N tables do not each ask for their own run; returns the way to take
 * them down again, for when there is no longer a member to sync for.
 */
export function installSyncTriggers(): () => void {
  const onOnline = () => void syncAll();
  const onVisible = () => {
    if (document.visibilityState === 'visible') void syncAll();
  };
  window.addEventListener('online', onOnline);
  document.addEventListener('visibilitychange', onVisible);
  return () => {
    window.removeEventListener('online', onOnline);
    document.removeEventListener('visibilitychange', onVisible);
  };
}

/** Sync unless a run is going on or one ended within SYNC_FRESH_MS. For a
 *  screen that opens: it wants what is on the server, but moving around the
 *  app must not sync at every tap. Reconnecting, coming back to the app and
 *  a local change ask for a run outright. */
export async function syncIfStale(): Promise<void> {
  if (syncing || (lastRunAt !== null && Date.now() - lastRunAt < SYNC_FRESH_MS)) return;
  await syncAll();
}

/** What a failure can be told in a log. Never the whole error: a rejected
 *  write comes back quoting the row that caused it, and rows are private. */
function describe(err: unknown): string {
  if (err !== null && typeof err === 'object' && 'message' in err) {
    const { code, message } = err as { code?: string; message?: string };
    return code ? `${code}: ${message}` : `${message}`;
  }
  return `${err}`;
}

/**
 * Whether the server will never take this row — it breaks a constraint, or
 * asks for something this session may not do. Such a row would otherwise stop
 * every later row of its table on this device, run after run; the caller goes
 * on instead and leaves it queued, which costs one request a run. Says so in
 * the log, because nothing else will.
 */
function refusedForGood(table: string, error: { code?: string; message?: string }): boolean {
  if (!isPermanentRowError(error)) return false;
  console.warn(`[offline] ${table}: the server refused a row, skipping it:`, describe(error));
  return true;
}

/** The whole table from the server, a page at a time: PostgREST answers a
 *  plain select with its first page only and says nothing about the rest, and
 *  a short read would look exactly like rows deleted elsewhere. Ordered by id
 *  so the pages stay a partition while other devices write. */
async function pull(spec: TableSpec): Promise<Record<string, unknown>[]> {
  // The table name is dynamic, so supabase-js can't infer a row type — cast
  // the plain rows we asked for.
  const columns = ['id', ...columnNames(spec), 'created_at', 'updated_at'].join(', ');
  const rows: Record<string, unknown>[] = [];
  for (let from = 0; ; from += SYNC_PULL_PAGE) {
    const { data, error } = await supabase
      .from(spec.table)
      .select(columns)
      .order('id')
      .range(from, from + SYNC_PULL_PAGE - 1);
    if (error) throw error;
    const page = (data ?? []) as unknown as Record<string, unknown>[];
    rows.push(...page);
    if (page.length < SYNC_PULL_PAGE) return rows;
  }
}

async function syncTable(spec: TableSpec): Promise<void> {
  // 1. Queued creates/updates — the objects are already in server shape.
  for (const row of await engine.getPendingUpserts(spec)) {
    const { error } = await supabase.from(spec.table).upsert(row);
    if (error) {
      if (!refusedForGood(spec.table, error)) throw error;
      continue;
    }
    await engine.markUpserted(spec, row.id, row.updated_at);
  }

  // 2. Queued deletes (unconditional — "delete wins" under last-write-wins).
  for (const id of await engine.getPendingDeletes(spec)) {
    const { error } = await supabase.from(spec.table).delete().eq('id', id);
    if (error) {
      if (!refusedForGood(spec.table, error)) throw error;
      continue;
    }
    await engine.markDeleted(spec, id);
  }

  // 3. Full pull + reconcile.
  await engine.reconcile(spec, await pull(spec));
}
