// =============================================================================
// The tables that never leave the device: what a sync would have to carry
// wholesale, and could not. They are created and wiped with the synced ones,
// but nothing generic reads them — each is written and read where it is used
// (an attachment's file in attachmentFiles.ts, a guide's images in the guides
// app), over the engine's local query API.
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

/** Every local-only table, created on init and wiped on sign-out. */
export const LOCAL_SPECS: LocalTableSpec[] = [GUIDE_IMAGE_CACHE, ATTACHMENT_FILES];
