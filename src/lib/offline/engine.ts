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
import { ALL_SPECS, ATTACHMENTS_SPEC, type ColumnSpec, type TableSpec } from './specs';
import { checkDbOwnership, MultiTabError } from './singleTab';

type Row = Record<string, unknown>;

// Lazily created so the worker/OPFS only spin up once an offline table is
// actually used (never for non-members, who never reach this code).
let ready: Promise<SQLocal> | null = null;

/**
 * The local client, guaranteed to have every column its specs declare. `onInit`
 * creates missing tables; this additionally ALTERs in any column added to a spec
 * after a client first created the table, so an existing local database picks up
 * new columns instead of erroring on them. Additive only — a column added this
 * way must be nullable or carry a DEFAULT (SQLite's rule for ADD COLUMN).
 *
 * The database is opened through a custom worker that uses the OPFS SAH-pool VFS
 * (sahpoolWorker.ts) so it persists without COOP/COEP headers. Opening is gated
 * on this tab owning the single-connection lock; a non-owner throws MultiTabError.
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
          sql(IMAGE_CACHE_SQL),
          sql(ATTACHMENT_FILES_SQL),
        ],
      });
      return migrateColumns(c).then(() => c);
    });
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

// Guide images are too large to pull wholesale like the spec tables, so they
// are fetched one at a time on first use and kept here (local-only, never
// synced) so chapters keep rendering offline. Contents stay base64 text, the
// form they arrive in, which also avoids binding blobs across the worker.
const IMAGE_CACHE_TABLE = 'guide_image_cache';
const IMAGE_CACHE_SQL = `CREATE TABLE IF NOT EXISTS ${IMAGE_CACHE_TABLE} (
    key TEXT PRIMARY KEY,
    mime TEXT NOT NULL,
    data TEXT NOT NULL
  )`;

// Attachment files (encrypted, as stored in the bucket) are kept beside their
// rows but never pulled wholesale: one file can be megabytes. A file added on
// this device waits here until its upload goes through; one opened here is
// kept so it shows again with no connection. Local-only, never synced.
//   - uploaded: 0 | 1 — whether the bucket has this file.
//   - upload_error: set when the bucket refused it for good (too large, wrong
//     type): such a file is not retried, only shown as failed.
export const ATTACHMENT_FILES_TABLE = 'attachment_files';
const ATTACHMENT_FILES_SQL = `CREATE TABLE IF NOT EXISTS ${ATTACHMENT_FILES_TABLE} (
    id TEXT PRIMARY KEY,
    data BLOB NOT NULL,
    uploaded INTEGER NOT NULL DEFAULT 0,
    upload_error TEXT
  )`;

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

/** Insert a new row with a client-generated id (or the one given, for a row
 *  whose id something else already refers to), queued for upsert; returns the id. */
export async function insert(
  spec: TableSpec,
  values: Row,
  id: string = crypto.randomUUID(),
): Promise<string> {
  const ts = nowIso();
  const cols = [
    'id',
    ...spec.columns.map((c) => c.name),
    'created_at',
    'updated_at',
    'pending_op',
    'synced',
  ];
  const params = [id, ...spec.columns.map((c) => toDb(c, values[c.name])), ts, ts, 'upsert', 0];
  const placeholders = cols.map(() => '?').join(', ');
  const c = await db();
  await c.sql(`INSERT INTO ${spec.table} (${cols.join(', ')}) VALUES (${placeholders})`, ...params);
  emit(spec.table);
  return id;
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
  await c.sql(`DELETE FROM ${IMAGE_CACHE_TABLE}`);
  await c.sql(`DELETE FROM ${ATTACHMENT_FILES_TABLE}`);
  for (const spec of ALL_SPECS) emit(spec.table);
  emit(ATTACHMENT_FILES_TABLE);
}

// ─── Local-only image cache ──────────────────────────────────────────────────

/** An image's MIME type and base64-encoded contents. */
export interface CachedImage {
  mime: string;
  data: string;
}

/** The locally cached image for a key, or null if it has never been fetched. */
export async function getCachedImage(key: string): Promise<CachedImage | null> {
  const c = await db();
  const rows = await c.sql<CachedImage>(
    `SELECT mime, data FROM ${IMAGE_CACHE_TABLE} WHERE key = ?`,
    key,
  );
  return rows[0] ?? null;
}

/** Keep an image locally so later reads need no connection. */
export async function putCachedImage(key: string, image: CachedImage): Promise<void> {
  const c = await db();
  await c.sql(
    `INSERT OR REPLACE INTO ${IMAGE_CACHE_TABLE} (key, mime, data) VALUES (?, ?, ?)`,
    key,
    image.mime,
    image.data,
  );
}

// ─── Local-only attachment files ─────────────────────────────────────────────

/** Where the local copy of an attachment's file stands with the bucket. */
export type AttachmentUploadState = 'uploaded' | 'pending' | 'failed';

type AttachmentFileRow = {
  id: string;
  data: Uint8Array<ArrayBuffer>;
  uploaded: number;
  upload_error: string | null;
};

function uploadState(row: {
  uploaded: number;
  upload_error: string | null;
}): AttachmentUploadState {
  if (row.uploaded) return 'uploaded';
  return row.upload_error === null ? 'pending' : 'failed';
}

/** The locally held file (encrypted) for an attachment, or null if it was never
 *  added or opened on this device. */
export async function getAttachmentFile(id: string): Promise<Uint8Array<ArrayBuffer> | null> {
  const c = await db();
  const rows = await c.sql<Pick<AttachmentFileRow, 'data'>>(
    `SELECT data FROM ${ATTACHMENT_FILES_TABLE} WHERE id = ?`,
    id,
  );
  return rows[0]?.data ?? null;
}

/** Where an attachment's file stands with the bucket, or null when this device
 *  holds no copy (then the bucket is the only place it may be). */
export async function getAttachmentUploadState(id: string): Promise<AttachmentUploadState | null> {
  const c = await db();
  const rows = await c.sql<Pick<AttachmentFileRow, 'uploaded' | 'upload_error'>>(
    `SELECT uploaded, upload_error FROM ${ATTACHMENT_FILES_TABLE} WHERE id = ?`,
    id,
  );
  return rows[0] ? uploadState(rows[0]) : null;
}

/** The ids of every attachment whose file this device holds. */
export async function listAttachmentFileIds(): Promise<string[]> {
  const c = await db();
  const rows = await c.sql<Pick<AttachmentFileRow, 'id'>>(
    `SELECT id FROM ${ATTACHMENT_FILES_TABLE}`,
  );
  return rows.map((row) => row.id);
}

/** Keep an attachment's file locally: one just added here (`uploaded` false,
 *  queued for upload) or one fetched from the bucket (`uploaded` true). */
export async function putAttachmentFile(
  id: string,
  data: Uint8Array,
  uploaded: boolean,
): Promise<void> {
  const c = await db();
  await c.sql(
    `INSERT OR REPLACE INTO ${ATTACHMENT_FILES_TABLE} (id, data, uploaded, upload_error) VALUES (?, ?, ?, NULL)`,
    id,
    data,
    uploaded ? 1 : 0,
  );
  emit(ATTACHMENT_FILES_TABLE);
}

/** Files still waiting to reach the bucket (not the ones it refused for good). */
export async function listPendingUploads(): Promise<
  { id: string; data: Uint8Array<ArrayBuffer> }[]
> {
  const c = await db();
  return c.sql<Pick<AttachmentFileRow, 'id' | 'data'>>(
    `SELECT id, data FROM ${ATTACHMENT_FILES_TABLE} WHERE uploaded = 0 AND upload_error IS NULL`,
  );
}

export async function markAttachmentUploaded(id: string): Promise<void> {
  const c = await db();
  await c.sql(
    `UPDATE ${ATTACHMENT_FILES_TABLE} SET uploaded = 1, upload_error = NULL WHERE id = ?`,
    id,
  );
  emit(ATTACHMENT_FILES_TABLE);
}

/** Record that the bucket refused this file for good, so it is not retried. */
export async function markAttachmentUploadFailed(id: string, error: string): Promise<void> {
  const c = await db();
  await c.sql(`UPDATE ${ATTACHMENT_FILES_TABLE} SET upload_error = ? WHERE id = ?`, error, id);
  emit(ATTACHMENT_FILES_TABLE);
}

export async function deleteAttachmentFile(id: string): Promise<void> {
  const c = await db();
  await c.sql(`DELETE FROM ${ATTACHMENT_FILES_TABLE} WHERE id = ?`, id);
  emit(ATTACHMENT_FILES_TABLE);
}

/** Drop the files of attachments that no longer exist here (deleted, on this
 *  device or elsewhere), pending uploads included: with the row gone there is
 *  nothing to upload for. */
export async function pruneAttachmentFiles(): Promise<void> {
  const c = await db();
  await c.sql(
    `DELETE FROM ${ATTACHMENT_FILES_TABLE} WHERE id NOT IN (SELECT id FROM ${ATTACHMENTS_SPEC.table})`,
  );
  emit(ATTACHMENT_FILES_TABLE);
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
  let changed = false;
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
        changed = true;
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
