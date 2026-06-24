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

// Serialize syncs; if one is requested while another runs, run exactly one more
// afterwards so the latest local changes always get a chance to push.
let syncing = false;
let rerun = false;

/** Best-effort sync of all tables. Never throws — pending changes simply stay
 *  queued for a later attempt. */
export async function syncAll(): Promise<void> {
  if (!navigator.onLine) return;
  if (syncing) {
    rerun = true;
    return;
  }
  syncing = true;
  try {
    do {
      rerun = false;
      for (const spec of ALL_SPECS) await syncTable(spec);
    } while (rerun && navigator.onLine);
  } catch (err) {
    // Network blip, expired token, etc. Queued changes stay put; we retry on
    // the next trigger (online event, app focus, or the next user action).
    console.warn('[offline] sync failed, will retry later:', err);
  } finally {
    syncing = false;
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
