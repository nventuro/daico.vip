// =============================================================================
// Generic local-first store backed by SQLite in the browser (SQLocal over OPFS,
// in a Web Worker). Drives every table declared in specs.ts, so the UI reads
// and writes locally — instant, and working with no connection.
//
// Each local row mirrors its Postgres table plus two LOCAL-ONLY bookkeeping
// columns that are never sent to the server:
//   - pending_op: NULL | 'upsert' | 'delete' — a queued change awaiting sync.
//   - synced:     0 | 1 — whether the row is known to exist on the server.
//
// Folding the sync queue into the row itself (vs. a separate outbox table)
// keeps a write and its queued op in one atomic statement. A row pending
// 'delete' is a transient local tombstone: hidden from the UI, kept only until
// its delete is pushed. The sync engine lives in sync.ts.
//
// Identifiers (table/column names) interpolated into SQL come only from the
// static specs, never from user input; values always travel as `?` bindings.
// SQLocal's `sql(query, ...params)` is variadic, so param arrays are spread.
// =============================================================================
import { SQLocal } from 'sqlocal';
import { LOCAL_DB_PATH } from '../../types';
import { ALL_SPECS, type ColumnSpec, type TableSpec } from './specs';

type Row = Record<string, unknown>;

// Lazily created so the worker/OPFS only spin up once an offline table is
// actually used (never for non-members, who never reach this code).
let client: SQLocal | null = null;
let ready: Promise<SQLocal> | null = null;

/**
 * The local client, guaranteed to have every column its specs declare. `onInit`
 * creates missing tables; this additionally ALTERs in any column added to a spec
 * after a client first created the table, so an existing local database picks up
 * new columns instead of erroring on them. Additive only — a column added this
 * way must be nullable or carry a DEFAULT (SQLite's rule for ADD COLUMN).
 */
function db(): Promise<SQLocal> {
  if (!ready) {
    const c = (client ??= new SQLocal({
      databasePath: LOCAL_DB_PATH,
      onInit: (sql) => ALL_SPECS.map((spec) => sql(createTableSql(spec))),
    }));
    ready = migrateColumns(c).then(() => c);
  }
  return ready;
}

async function migrateColumns(c: SQLocal): Promise<void> {
  for (const spec of ALL_SPECS) {
    const existing = await c.sql<{ name: string }>(`PRAGMA table_info(${spec.table})`);
    const present = new Set(existing.map((col) => col.name));
    for (const col of spec.columns) {
      if (!present.has(col.name)) {
        await c.sql(`ALTER TABLE ${spec.table} ADD COLUMN ${col.name} ${col.ddl}`);
      }
    }
  }
}

function createTableSql(spec: TableSpec): string {
  const appColumns = spec.columns.map((c) => `${c.name} ${c.ddl}`).join(', ');
  return `CREATE TABLE IF NOT EXISTS ${spec.table} (
    id TEXT PRIMARY KEY,
    ${appColumns},
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL,
    pending_op TEXT,
    synced INTEGER NOT NULL DEFAULT 0
  )`;
}

function nowIso(): string {
  return new Date().toISOString();
}

/** App value → stored value (booleans become 0/1; undefined becomes NULL). */
function toDb(col: ColumnSpec, value: unknown): unknown {
  if (col.boolean) return value ? 1 : 0;
  return value === undefined ? null : value;
}

/** Stored value → app value (0/1 becomes boolean). */
function fromDb(col: ColumnSpec, value: unknown): unknown {
  if (col.boolean) return value !== 0 && value !== null;
  return value;
}

/** A raw local row → the app-facing object (no bookkeeping columns). */
function toObject<T>(spec: TableSpec, row: Row): T {
  const obj: Row = {
    id: row.id,
    created_at: row.created_at,
    updated_at: row.updated_at,
  };
  for (const col of spec.columns) obj[col.name] = fromDb(col, row[col.name]);
  return obj as T;
}

// ─── Reads ───────────────────────────────────────────────────────────────────

/** The visible rows (hides items queued for deletion), in the spec's order. */
export async function listVisible<T>(spec: TableSpec): Promise<T[]> {
  const c = await db();
  const rows = await c.sql<Row>(
    `SELECT * FROM ${spec.table} WHERE pending_op IS NOT 'delete' ORDER BY ${spec.orderBy}`,
  );
  return rows.map((r) => toObject<T>(spec, r));
}

// ─── Local mutations (instant, offline-safe) ─────────────────────────────────

/** Insert a new row with a client-generated id, queued for upsert. */
export async function insert(spec: TableSpec, values: Row): Promise<void> {
  const ts = nowIso();
  const cols = [
    'id',
    ...spec.columns.map((c) => c.name),
    'created_at',
    'updated_at',
    'pending_op',
    'synced',
  ];
  const params = [
    crypto.randomUUID(),
    ...spec.columns.map((c) => toDb(c, values[c.name])),
    ts,
    ts,
    'upsert',
    0,
  ];
  const placeholders = cols.map(() => '?').join(', ');
  const c = await db();
  await c.sql(`INSERT INTO ${spec.table} (${cols.join(', ')}) VALUES (${placeholders})`, ...params);
}

/** Patch app columns of a row and queue the change. */
export async function update(spec: TableSpec, id: string, patch: Row): Promise<void> {
  const patched = spec.columns.filter((c) => c.name in patch);
  const sets = patched.map((c) => `${c.name} = ?`);
  const params: unknown[] = patched.map((c) => toDb(c, patch[c.name]));
  sets.push('updated_at = ?');
  params.push(nowIso());
  sets.push("pending_op = 'upsert'");
  const c = await db();
  await c.sql(
    `UPDATE ${spec.table} SET ${sets.join(', ')} WHERE id = ? AND pending_op IS NOT 'delete'`,
    ...params,
    id,
  );
}

/**
 * Delete a row. One never pushed to the server (synced = 0) is dropped
 * outright; an already-synced row becomes a local tombstone so the delete can
 * be replayed on the next sync.
 */
export async function remove(spec: TableSpec, id: string): Promise<void> {
  const ts = nowIso();
  const c = await db();
  await c.transaction(async (tx) => {
    await tx.sql(`DELETE FROM ${spec.table} WHERE id = ? AND synced = 0`, id);
    await tx.sql(
      `UPDATE ${spec.table} SET pending_op = 'delete', updated_at = ? WHERE id = ? AND synced = 1`,
      ts,
      id,
    );
  });
}

/** Wipe all local data across every table (sign-out — shared-device hygiene). */
export async function clearAll(): Promise<void> {
  const c = await db();
  for (const spec of ALL_SPECS) {
    await c.sql(`DELETE FROM ${spec.table}`);
  }
}

// ─── Sync support (used by sync.ts) ──────────────────────────────────────────

/** Rows with a queued create/update, as full server-shaped objects to push. */
export async function getPendingUpserts<T>(spec: TableSpec): Promise<T[]> {
  const c = await db();
  const rows = await c.sql<Row>(`SELECT * FROM ${spec.table} WHERE pending_op = 'upsert'`);
  return rows.map((r) => toObject<T>(spec, r));
}

/** Ids of rows whose deletion still needs to be pushed. */
export async function getPendingDeletes(spec: TableSpec): Promise<string[]> {
  const c = await db();
  const rows = await c.sql<{ id: string }>(
    `SELECT id FROM ${spec.table} WHERE pending_op = 'delete'`,
  );
  return rows.map((r) => r.id);
}

/**
 * Clear the 'upsert' flag after a successful push — but only if the row hasn't
 * changed since (its updated_at still matches what we pushed), so a concurrent
 * local edit is never silently dropped.
 */
export async function markUpserted(
  spec: TableSpec,
  id: string,
  pushedUpdatedAt: string,
): Promise<void> {
  const c = await db();
  await c.sql(
    `UPDATE ${spec.table} SET pending_op = NULL, synced = 1
     WHERE id = ? AND pending_op = 'upsert' AND updated_at = ?`,
    id,
    pushedUpdatedAt,
  );
}

/** Drop a local tombstone once its delete has been pushed. */
export async function markDeleted(spec: TableSpec, id: string): Promise<void> {
  const c = await db();
  await c.sql(`DELETE FROM ${spec.table} WHERE id = ? AND pending_op = 'delete'`, id);
}

/**
 * Merge the full set of server rows into the local store (last-write-wins by
 * updated_at), then drop clean local rows the server no longer has (deleted
 * elsewhere). Locally-pending rows are left untouched so unsynced edits survive
 * a pull. Comparisons parse epoch millis to stay correct across timestamp
 * formats ("...Z" vs "...+00:00").
 */
export async function reconcile(spec: TableSpec, remote: Row[]): Promise<void> {
  const insertCols = [
    'id',
    ...spec.columns.map((c) => c.name),
    'created_at',
    'updated_at',
    'pending_op',
    'synced',
  ];
  const insertPlaceholders = insertCols.map(() => '?').join(', ');
  const c = await db();
  await c.transaction(async (tx) => {
    const remoteIds = new Set<string>();

    for (const r of remote) {
      const id = r.id as string;
      remoteIds.add(id);
      const existing = await tx.sql<Row>(`SELECT * FROM ${spec.table} WHERE id = ?`, id);
      const local = existing[0];

      if (!local) {
        await tx.sql(
          `INSERT INTO ${spec.table} (${insertCols.join(', ')}) VALUES (${insertPlaceholders})`,
          id,
          ...spec.columns.map((c) => toDb(c, r[c.name])),
          r.created_at,
          r.updated_at,
          null,
          1,
        );
      } else if (local.pending_op === null) {
        if (Date.parse(r.updated_at as string) > Date.parse(local.updated_at as string)) {
          const setCols = [...spec.columns.map((c) => c.name), 'created_at', 'updated_at'];
          const sets = setCols.map((c) => `${c} = ?`).concat('synced = 1');
          await tx.sql(
            `UPDATE ${spec.table} SET ${sets.join(', ')} WHERE id = ?`,
            ...spec.columns.map((c) => toDb(c, r[c.name])),
            r.created_at,
            r.updated_at,
            id,
          );
        } else if (local.synced === 0) {
          // Server already has it; mark so a later delete pushes a tombstone.
          await tx.sql(`UPDATE ${spec.table} SET synced = 1 WHERE id = ?`, id);
        }
      }
      // Rows with a pending op keep their local change; sync will push it.
    }

    // Delete detection: a previously-synced, unmodified row absent from the
    // server set was deleted elsewhere — remove it locally too.
    const clean = await tx.sql<{ id: string }>(
      `SELECT id FROM ${spec.table} WHERE synced = 1 AND pending_op IS NULL`,
    );
    for (const row of clean) {
      if (!remoteIds.has(row.id)) {
        await tx.sql(`DELETE FROM ${spec.table} WHERE id = ?`, row.id);
      }
    }
  });
}
