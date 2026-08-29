// =============================================================================
// Generic local-first store backed by SQLite in the browser (SQLocal over OPFS,
// in a Web Worker). Drives every table a spec declares, so the UI reads
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
// its delete is pushed.
//
// Identifiers (table/column names) interpolated into SQL come only from the
// static specs, never from user input; values always travel as `?` bindings.
// SQLocal's `sql(query, ...params)` is variadic, so param arrays are spread.
// =============================================================================
import { SQLocal } from 'sqlocal';
import type { SyncedRow } from '../../types';
import {
  ALL_SPECS,
  columnNames,
  columnsOf,
  type ColumnSpec,
  type RowInput,
  type TableSpec,
} from './specs';
import { LOCAL_SPECS } from './localTables';
import { checkDbOwnership, MultiTabError } from './singleTab';

/** Filename of the local OPFS-backed SQLite database used for offline data. */
const LOCAL_DB_PATH = 'daico-local.sqlite3';

type DbRow = Record<string, unknown>;

// Lazily created so the worker/OPFS only spin up once an offline table is
// actually used (never for non-members, who never reach this code).
let ready: Promise<SQLocal> | null = null;

/**
 * The local client, guaranteed to hold every table in the shape its spec
 * declares: `onInit` creates the ones that are missing, and `migrateTables`
 * brings the ones an older client left behind up to date.
 *
 * It is opened through a worker of its own, on a VFS that persists without
 * cross-origin isolation and takes one connection per origin, so opening is
 * gated on this tab owning it: a non-owner throws MultiTabError.
 */
function db(): Promise<SQLocal> {
  if (!ready) {
    ready = checkDbOwnership().then((owner) => {
      if (!owner) throw new MultiTabError();
      const c = new SQLocal({
        databasePath: LOCAL_DB_PATH,
        processor: new Worker(new URL('./sahpoolWorker.ts', import.meta.url), { type: 'module' }),
        onInit: (sql) => [
          // A delete frees the page it was on; without this it keeps whatever
          // was written there, and a sign-out is supposed to leave nothing.
          sql('PRAGMA secure_delete = ON'),
          ...ALL_SPECS.map((spec) => sql(createTableSql(spec))),
          ...LOCAL_SPECS.map((spec) => sql(spec.ddl)),
        ],
      });
      return migrateTables(c).then(() => c);
    });
  }
  return ready;
}

/**
 * Every table brought to the shape its spec declares. A table a client created
 * under an older spec can be a column short or a column over: a column the
 * spec has gained is added in place where SQLite takes it, which keeps the
 * rows and whatever is queued on them, and anything else is settled by
 * emptying the table.
 */
async function migrateTables(c: SQLocal): Promise<void> {
  for (const spec of ALL_SPECS) {
    const columns = localColumns(spec);
    const info = await c.sql<{ name: string }>(`PRAGMA table_info(${spec.table})`);
    const present = new Set(info.map((col) => col.name));
    const expected = new Set(columns.map(([name]) => name));
    const missing = columns.filter(([name]) => !present.has(name));
    const over = [...present].filter((name) => !expected.has(name));
    if (over.length > 0 || missing.some(([, ddl]) => !addable(ddl))) {
      // Nothing here can be carried over: a row stored without a column the
      // shape now requires has no value to give it, and one queued in the old
      // shape is not a row the server would take either. The table is a copy
      // of the server's, so the next sync brings it back whole.
      await c.sql(`DROP TABLE IF EXISTS ${spec.table}`);
      await c.sql(createTableSql(spec));
      continue;
    }
    for (const [name, ddl] of missing) {
      await c.sql(`ALTER TABLE ${spec.table} ADD COLUMN ${name} ${ddl}`);
    }
  }
}

/** Whether SQLite takes this column on a table that already exists: it refuses
 *  a primary key, a unique one, and one that is NOT NULL without a default. */
function addable(ddl: string): boolean {
  if (/\b(PRIMARY KEY|UNIQUE)\b/i.test(ddl)) return false;
  return !/\bNOT NULL\b/i.test(ddl) || /\bDEFAULT\b/i.test(ddl);
}

/** Every column of a local table with its declaration, in DDL order: the id,
 *  the spec's own columns, the timestamps, then the engine's bookkeeping. */
function localColumns(spec: TableSpec): [string, string][] {
  return [
    ['id', 'TEXT PRIMARY KEY'],
    ...columnsOf(spec).map(([name, col]): [string, string] => [name, col.ddl]),
    ['created_at', 'TEXT NOT NULL'],
    ['updated_at', 'TEXT NOT NULL'],
    ['pending_op', 'TEXT'],
    ['synced', 'INTEGER NOT NULL DEFAULT 0'],
  ];
}

function createTableSql(spec: TableSpec): string {
  const columns = localColumns(spec)
    .map(([name, ddl]) => `${name} ${ddl}`)
    .join(', ');
  return `CREATE TABLE IF NOT EXISTS ${spec.table} (${columns})`;
}

function nowIso(): string {
  return new Date().toISOString();
}

function toDb(col: ColumnSpec, value: unknown): unknown {
  if (col.boolean) return value ? 1 : 0;
  return value === undefined ? null : value;
}

function fromDb(col: ColumnSpec, value: unknown): unknown {
  if (col.boolean) return value !== 0 && value !== null;
  return value;
}

/** A raw local row without the bookkeeping columns, as the app reads it. */
function toObject<Row>(spec: TableSpec, row: DbRow): Row {
  const obj: DbRow = {
    id: row.id,
    created_at: row.created_at,
    updated_at: row.updated_at,
  };
  for (const [name, col] of columnsOf(spec)) obj[name] = fromDb(col, row[name]);
  return obj as Row;
}

// ─── Change events ───────────────────────────────────────────────────────────

// Several hooks may watch one table at the same time, so every local write and
// every sync merge that changed rows notifies all of them — each instance
// reloads, not only the one that wrote.
const listeners = new Map<string, Set<() => void>>();

/** Run `listener` whenever `table`'s local rows change; returns the unsubscribe. */
export function subscribe(table: string, listener: () => void): () => void {
  let set = listeners.get(table);
  if (!set) {
    set = new Set();
    listeners.set(table, set);
  }
  set.add(listener);
  return () => {
    set.delete(listener);
  };
}

function emit(table: string): void {
  listeners.get(table)?.forEach((listener) => listener());
}

// ─── Local-only tables ───────────────────────────────────────────────────────

// The synced tables are read and written through the spec API below; a
// local-only table is read and written by its owner, whose statements are as
// static as a spec's.

/** Rows of a local-only table. */
export async function localQuery<T extends Record<string, unknown>>(
  sql: string,
  ...params: unknown[]
): Promise<T[]> {
  const c = await db();
  return c.sql<T>(sql, ...params);
}

/** A write to a local-only table, reported to whoever watches `table`. */
export async function localWrite(table: string, sql: string, ...params: unknown[]): Promise<void> {
  const c = await db();
  await c.sql(sql, ...params);
  emit(table);
}

// ─── Reads ───────────────────────────────────────────────────────────────────

/** The visible rows (hides items queued for deletion), in the spec's order. */
export async function listVisible<Row extends SyncedRow>(spec: TableSpec<Row>): Promise<Row[]> {
  const c = await db();
  const rows = await c.sql<DbRow>(
    `SELECT * FROM ${spec.table} WHERE pending_op IS NOT 'delete' ORDER BY ${spec.orderBy}`,
  );
  return rows.map((r) => toObject<Row>(spec, r));
}

// ─── Local mutations (instant, offline-safe) ─────────────────────────────────

/** Insert a new row with a client-generated id (or the one given, for a row
 *  whose id something else already refers to), queued for upsert; returns the id. */
export async function insert<Row extends SyncedRow>(
  spec: TableSpec<Row>,
  values: RowInput<Row>,
  id: string = crypto.randomUUID(),
): Promise<string> {
  const ts = nowIso();
  const cols = ['id', ...columnNames(spec), 'created_at', 'updated_at', 'pending_op', 'synced'];
  const given = values as DbRow;
  const params = [
    id,
    ...columnsOf(spec).map(([name, col]) => toDb(col, given[name])),
    ts,
    ts,
    'upsert',
    0,
  ];
  const placeholders = cols.map(() => '?').join(', ');
  const c = await db();
  await c.sql(`INSERT INTO ${spec.table} (${cols.join(', ')}) VALUES (${placeholders})`, ...params);
  emit(spec.table);
  return id;
}

/** Patch app columns of a row and queue the change. */
export async function update<Row extends SyncedRow>(
  spec: TableSpec<Row>,
  id: string,
  patch: Partial<RowInput<Row>>,
): Promise<void> {
  const given = patch as DbRow;
  const patched = columnsOf(spec).filter(([name]) => name in given);
  const sets = patched.map(([name]) => `${name} = ?`);
  const params: unknown[] = patched.map(([name, col]) => toDb(col, given[name]));
  sets.push('updated_at = ?');
  params.push(nowIso());
  sets.push("pending_op = 'upsert'");
  const c = await db();
  await c.sql(
    `UPDATE ${spec.table} SET ${sets.join(', ')} WHERE id = ? AND pending_op IS NOT 'delete'`,
    ...params,
    id,
  );
  emit(spec.table);
}

/**
 * Delete a row: it becomes a local tombstone so the delete is replayed on the
 * next sync. A row not yet marked synced gets one too — whether the server
 * already has it is only known once its push completes, and a delete pushed
 * for a row the server never had is harmless.
 */
export async function remove(spec: TableSpec, id: string): Promise<void> {
  const c = await db();
  await c.sql(
    `UPDATE ${spec.table} SET pending_op = 'delete', updated_at = ? WHERE id = ?`,
    nowIso(),
    id,
  );
  emit(spec.table);
}

/** Wipe all local data across every table (sign-out — shared-device hygiene). */
export async function clearAll(): Promise<void> {
  const c = await db();
  for (const spec of ALL_SPECS) {
    await c.sql(`DELETE FROM ${spec.table}`);
  }
  for (const spec of LOCAL_SPECS) await c.sql(`DELETE FROM ${spec.table}`);
  for (const spec of [...ALL_SPECS, ...LOCAL_SPECS]) emit(spec.table);
}

// ─── Sync support ────────────────────────────────────────────────────────────

/** Rows with a queued create/update, as full server-shaped objects to push. */
export async function getPendingUpserts<Row extends SyncedRow>(
  spec: TableSpec<Row>,
): Promise<Row[]> {
  const c = await db();
  const rows = await c.sql<DbRow>(`SELECT * FROM ${spec.table} WHERE pending_op = 'upsert'`);
  return rows.map((r) => toObject<Row>(spec, r));
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
export async function reconcile(spec: TableSpec, remote: DbRow[]): Promise<void> {
  const insertCols = [
    'id',
    ...columnNames(spec),
    'created_at',
    'updated_at',
    'pending_op',
    'synced',
  ];
  const insertPlaceholders = insertCols.map(() => '?').join(', ');
  const c = await db();
  let changed = false;
  await c.transaction(async (tx) => {
    const remoteIds = new Set<string>();

    for (const r of remote) {
      const id = r.id as string;
      remoteIds.add(id);
      const existing = await tx.sql<DbRow>(`SELECT * FROM ${spec.table} WHERE id = ?`, id);
      const local = existing[0];

      if (!local) {
        await tx.sql(
          `INSERT INTO ${spec.table} (${insertCols.join(', ')}) VALUES (${insertPlaceholders})`,
          id,
          ...columnsOf(spec).map(([name, col]) => toDb(col, r[name])),
          r.created_at,
          r.updated_at,
          null,
          1,
        );
        changed = true;
      } else if (local.pending_op === null) {
        if (Date.parse(r.updated_at as string) > Date.parse(local.updated_at as string)) {
          const setCols = [...columnNames(spec), 'created_at', 'updated_at'];
          const sets = setCols.map((c) => `${c} = ?`).concat('synced = 1');
          await tx.sql(
            `UPDATE ${spec.table} SET ${sets.join(', ')} WHERE id = ?`,
            ...columnsOf(spec).map(([name, col]) => toDb(col, r[name])),
            r.created_at,
            r.updated_at,
            id,
          );
          changed = true;
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
        changed = true;
      }
    }
  });
  if (changed) emit(spec.table);
}
