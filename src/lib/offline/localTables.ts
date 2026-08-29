// =============================================================================
// The tables that never leave the device: what a sync would have to carry
// wholesale and could not, and the engine's own bookkeeping. They are created
// and wiped with the synced ones; each is written and read by whoever owns it,
// the app's over the engine's local query API.
// =============================================================================

/** A local-only table: its name, and the whole CREATE TABLE that makes it. */
export interface LocalTableSpec {
  table: string;
  ddl: string;
}

/**
 * Guide images are too large to pull wholesale like the synced tables, so they
 * are fetched one at a time on first use and kept here so chapters keep
 * rendering offline. Contents stay base64 text, the form they arrive in, which
 * also avoids binding blobs across the worker.
 */
export const GUIDE_IMAGE_CACHE: LocalTableSpec = {
  table: 'guide_image_cache',
  ddl: `CREATE TABLE IF NOT EXISTS guide_image_cache (
    key TEXT PRIMARY KEY,
    mime TEXT NOT NULL,
    data TEXT NOT NULL
  )`,
};

/**
 * Attachment files (encrypted, as stored in the bucket) are kept beside their
 * rows but never pulled wholesale: one file can be megabytes. A file added on
 * this device waits here until its upload goes through; one opened here is
 * kept so it shows again with no connection.
 *   - uploaded: 0 | 1 — whether the bucket has this file.
 *   - upload_error: set when the bucket refused it for good (too large, wrong
 *     type): such a file is not retried, only shown as failed.
 */
export const ATTACHMENT_FILES: LocalTableSpec = {
  table: 'attachment_files',
  ddl: `CREATE TABLE IF NOT EXISTS attachment_files (
    id TEXT PRIMARY KEY,
    data BLOB NOT NULL,
    uploaded INTEGER NOT NULL DEFAULT 0,
    upload_error TEXT
  )`,
};

/**
 * Deletions queued on a table that had to be made again. A row waiting to be
 * deleted is an ordinary row of its table marked `pending_op`, so a table the
 * engine drops to bring it to its spec's shape takes the queued deletion with
 * it, and the next pull brings the row back on a device that deleted it. A
 * deletion is only an id, which every shape of a table has, so it is set aside
 * here and pushed from here. The engine owns this one.
 */
export const PENDING_DELETES: LocalTableSpec = {
  table: 'pending_deletes',
  ddl: `CREATE TABLE IF NOT EXISTS pending_deletes (
    table_name TEXT NOT NULL,
    id TEXT NOT NULL,
    PRIMARY KEY (table_name, id)
  )`,
};

/** Every local-only table, created on init and wiped on sign-out. */
export const LOCAL_SPECS: LocalTableSpec[] = [GUIDE_IMAGE_CACHE, ATTACHMENT_FILES, PENDING_DELETES];
