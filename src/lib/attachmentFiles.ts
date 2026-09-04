// =============================================================================
// The attachment files' side of sync. The rows travel with the tables; the
// files go to and from the storage bucket here, one at a time, and always as
// the opaque encrypted blob a file is — the keys never come near this module.
// =============================================================================
import { supabase } from './supabase';
import { isPermanentStatus } from './refusals';
import * as engine from './offline/engine';
import { ATTACHMENT_FILES } from './offline/localTables';
import { ATTACHMENTS_SPEC, type Attachment } from './offline/specs';
import { reportFiles } from './offline/sync';
import type { AttachmentOwnerKind } from '../types';
import { tooLargeMessage } from '../utils/textUtils';

/** The storage bucket holding the encrypted attachment files. */
export const ATTACHMENTS_BUCKET = 'attachments';

/** Largest file accepted as an attachment, in bytes. */
const ATTACHMENT_MAX_BYTES = 10 * 1024 * 1024;

/** The type of a PDF attachment; every other type accepted is a picture. */
export const PDF_TYPE = 'application/pdf';

/** File types accepted as attachments — the pictures both supported browsers
 *  can show, and PDFs, drawn page by page — and the extension a file of each
 *  gets when it leaves the app. */
export const ATTACHMENT_FILE_TYPES: Readonly<Record<string, string>> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
  'image/gif': 'gif',
  [PDF_TYPE]: 'pdf',
};

/** Whether an attachment of type `mime` is a PDF rather than a picture. */
export function isPdf(mime: string): boolean {
  return mime === PDF_TYPE;
}

/**
 * The kinds of entry whose files every device fetches and keeps, so they can
 * be seen with no connection wherever they were added: what is asked for at
 * a counter, and what is needed on a trip. Every other kind's files are
 * fetched on demand. Adding a kind here puts its every file on every device.
 */
export const KEPT_OWNER_KINDS: readonly AttachmentOwnerKind[] = ['document', 'trip_item'];

/** Whether `attachment`'s file is one every device keeps. */
function isKept(attachment: Pick<Attachment, 'owner_kind'>): boolean {
  return KEPT_OWNER_KINDS.includes(attachment.owner_kind);
}

/** The kept kinds as SQL takes them: fixed names, never anything typed. */
const keptKindsSql = KEPT_OWNER_KINDS.map((kind) => `'${kind}'`).join(', ');

/**
 * How old a bucket object with no attachment row must be before the orphan
 * sweep removes it. Younger ones may belong to a row another device created
 * and this one hasn't pulled yet.
 */
export const ATTACHMENT_ORPHAN_MIN_AGE_MS = 60 * 60 * 1000;

/** Objects fetched per page when listing the attachments bucket. */
export const ATTACHMENT_LIST_PAGE = 1000;

const bucket = () => supabase.storage.from(ATTACHMENTS_BUCKET);

/**
 * The attachment MIME type for `file`, or null when it is not one we take.
 * Trusts `file.type` when it is one of ours; otherwise falls back to the
 * filename extension, since some devices report `image/jpg` or no type at all
 * for a perfectly good file.
 */
export function attachmentType(file: File): string | null {
  if (file.type in ATTACHMENT_FILE_TYPES) return file.type;
  const extension = file.name.split('.').pop()?.toLowerCase();
  const match = Object.entries(ATTACHMENT_FILE_TYPES).find(([, ext]) => ext === extension);
  return match ? match[0] : null;
}

/** Why `file` cannot be attached, in the user's words, or null when it can. */
export function attachmentProblem(file: File): string | null {
  if (!attachmentType(file)) {
    return 'Solo se pueden adjuntar imágenes (JPG, PNG, WebP, GIF) o PDF.';
  }
  if (file.size > ATTACHMENT_MAX_BYTES) {
    return tooLargeMessage(file.size, ATTACHMENT_MAX_BYTES);
  }
  return null;
}

// ─── The copy this device holds ──────────────────────────────────────────────

/** Where the local copy of an attachment's file stands with the bucket. */
export type AttachmentUploadState = 'uploaded' | 'pending' | 'failed';

interface AttachmentFileRow {
  id: string;
  data: Uint8Array<ArrayBuffer>;
  uploaded: number;
  upload_error: string | null;
}

function uploadState(
  row: Pick<AttachmentFileRow, 'uploaded' | 'upload_error'>,
): AttachmentUploadState {
  if (row.uploaded) return 'uploaded';
  return row.upload_error === null ? 'pending' : 'failed';
}

/** The locally held file (encrypted) for an attachment, or null if it was never
 *  added or opened on this device. */
export async function localAttachmentFile(id: string): Promise<Uint8Array<ArrayBuffer> | null> {
  const rows = await engine.localQuery<Pick<AttachmentFileRow, 'data'>>(
    `SELECT data FROM ${ATTACHMENT_FILES.table} WHERE id = ?`,
    id,
  );
  return rows[0]?.data ?? null;
}

/** Where an attachment's file stands with the bucket, or null when this device
 *  holds no copy (then the bucket is the only place it may be). */
export async function attachmentUploadState(id: string): Promise<AttachmentUploadState | null> {
  const rows = await engine.localQuery<Pick<AttachmentFileRow, 'uploaded' | 'upload_error'>>(
    `SELECT uploaded, upload_error FROM ${ATTACHMENT_FILES.table} WHERE id = ?`,
    id,
  );
  return rows[0] ? uploadState(rows[0]) : null;
}

/** Keep an attachment's file locally: one just added here (`uploaded` false,
 *  queued for upload) or one fetched from the bucket (`uploaded` true). */
export async function putAttachmentFile(
  id: string,
  data: Uint8Array,
  uploaded: boolean,
): Promise<void> {
  await engine.localWrite(
    ATTACHMENT_FILES.table,
    `INSERT OR REPLACE INTO ${ATTACHMENT_FILES.table} (id, data, uploaded, upload_error) VALUES (?, ?, ?, NULL)`,
    id,
    data,
    uploaded ? 1 : 0,
  );
}

export async function deleteAttachmentFile(id: string): Promise<void> {
  await engine.localWrite(
    ATTACHMENT_FILES.table,
    `DELETE FROM ${ATTACHMENT_FILES.table} WHERE id = ?`,
    id,
  );
}

/** What this device's copies of the files come to: the room they take, how
 *  much of that is the kept kinds', and how many are still waiting for the
 *  bucket — of those, the ones it has refused for good. */
export interface AttachmentFileUsage {
  bytes: number;
  keptBytes: number;
  waiting: number;
  failed: number;
}

export async function attachmentFileUsage(): Promise<AttachmentFileUsage> {
  const rows = await engine.localQuery<AttachmentFileUsage & Record<string, unknown>>(
    `SELECT
       coalesce(sum(length(f.data)), 0) AS bytes,
       coalesce(sum(CASE WHEN a.owner_kind IN (${keptKindsSql}) THEN length(f.data) ELSE 0 END), 0)
         AS keptBytes,
       coalesce(sum(CASE WHEN f.uploaded = 0 THEN 1 ELSE 0 END), 0) AS waiting,
       coalesce(sum(CASE WHEN f.uploaded = 0 AND f.upload_error IS NOT NULL THEN 1 ELSE 0 END), 0)
         AS failed
     FROM ${ATTACHMENT_FILES.table} f
     LEFT JOIN ${ATTACHMENTS_SPEC.table} a ON a.id = f.id`,
  );
  return rows[0] ?? { bytes: 0, keptBytes: 0, waiting: 0, failed: 0 };
}

/**
 * Let go of the copies that can be fetched again: a file the bucket already
 * has, and not one of the kept kinds', since every device keeps those and the
 * next sync would bring them straight back. A file the bucket does not have is
 * the only copy there is anywhere, so it is never dropped here.
 */
export async function dropCachedFiles(): Promise<void> {
  await engine.localWrite(
    ATTACHMENT_FILES.table,
    `DELETE FROM ${ATTACHMENT_FILES.table}
      WHERE uploaded = 1
        AND id IN (SELECT id FROM ${ATTACHMENTS_SPEC.table} WHERE owner_kind NOT IN (${keptKindsSql}))`,
  );
}

/** Drop the files of attachments that no longer exist here (deleted, on this
 *  device or elsewhere), pending uploads included: with the row gone there is
 *  nothing to upload for. */
async function pruneAttachmentFiles(): Promise<void> {
  await engine.localWrite(
    ATTACHMENT_FILES.table,
    `DELETE FROM ${ATTACHMENT_FILES.table} WHERE id NOT IN (SELECT id FROM ${ATTACHMENTS_SPEC.table})`,
  );
}

// ─── The bucket ──────────────────────────────────────────────────────────────

/** The HTTP status a failed storage call reports, when it got as far as the server. */
function statusOf(error: { message: string }): number | undefined {
  return 'status' in error && typeof error.status === 'number' ? error.status : undefined;
}

/** Send every file still waiting for the bucket. Stops at the first refusal
 *  that may pass later, leaving that file and the rest for the next run. */
export async function uploadPending(): Promise<void> {
  // The ones the bucket refused for good are not among them: they are shown
  // as failed and never sent again.
  const waiting = await engine.localQuery<Pick<AttachmentFileRow, 'id' | 'data'>>(
    `SELECT id, data FROM ${ATTACHMENT_FILES.table} WHERE uploaded = 0 AND upload_error IS NULL`,
  );
  for (const { id, data } of waiting) {
    const { error } = await bucket().upload(id, new Blob([data]), {
      contentType: 'application/octet-stream',
      upsert: false,
    });
    if (!error) {
      await markUploaded(id);
      continue;
    }
    const status = statusOf(error);
    // Already there: an earlier attempt went through before its answer was lost.
    if (status === 409) {
      await markUploaded(id);
      continue;
    }
    if (isPermanentStatus(status)) {
      // Refused for good (too large, wrong type): recorded, never retried.
      await engine.localWrite(
        ATTACHMENT_FILES.table,
        `UPDATE ${ATTACHMENT_FILES.table} SET upload_error = ? WHERE id = ?`,
        error.message,
        id,
      );
      continue;
    }
    throw error;
  }
}

async function markUploaded(id: string): Promise<void> {
  await engine.localWrite(
    ATTACHMENT_FILES.table,
    `UPDATE ${ATTACHMENT_FILES.table} SET uploaded = 1, upload_error = NULL WHERE id = ?`,
    id,
  );
}

/** An object's bytes from the bucket, or null when the bucket does not have
 *  it (the device that added it hasn't uploaded it yet). A failure that may
 *  pass later — no session, throttled, the network — is thrown. */
async function downloadObject(id: string): Promise<Uint8Array | null> {
  const { data, error } = await bucket().download(id);
  if (error) {
    if (isPermanentStatus(statusOf(error))) return null;
    throw error;
  }
  return data ? new Uint8Array(await data.arrayBuffer()) : null;
}

/**
 * The encrypted file of an attachment: the copy kept on this device, else the
 * bucket's, kept from then on. Null when this device has none and cannot get
 * it now (no connection, or the device that added it hasn't uploaded it yet).
 */
export async function fetchAttachmentFile(id: string): Promise<Uint8Array | null> {
  const local = await localAttachmentFile(id);
  if (local) return local;
  if (!navigator.onLine) return null;
  let bytes: Uint8Array | null;
  try {
    bytes = await downloadObject(id);
  } catch {
    return null;
  }
  if (!bytes) return null;
  await putAttachmentFile(id, bytes, true);
  return bytes;
}

/**
 * Fetch every kept kind's file this device lacks, so its entry can be seen
 * with no connection wherever it was added. One the bucket does not have yet
 * is left for a later run; a failure that may pass later stops the run, with
 * the rest left for the next.
 */
async function fetchKeptFiles(): Promise<void> {
  const ids = await engine.localQuery<{ id: string }>(`SELECT id FROM ${ATTACHMENT_FILES.table}`);
  const held = new Set(ids.map((row) => row.id));
  const missing = (await engine.listVisible<Attachment>(ATTACHMENTS_SPEC)).filter(
    (attachment) => isKept(attachment) && !held.has(attachment.id),
  );
  reportFiles(0, missing.length);
  let done = 0;
  for (const attachment of missing) {
    const bytes = await downloadObject(attachment.id);
    if (bytes) await putAttachmentFile(attachment.id, bytes, true);
    reportFiles(++done, missing.length);
  }
}

/** Remove an attachment's object from the bucket, best effort: what this
 *  misses (no connection), the orphan sweep removes later. */
export async function removeAttachmentObject(id: string): Promise<void> {
  try {
    await bucket().remove([id]);
  } catch {
    // Left for the sweep.
  }
}

/**
 * Remove bucket objects no attachment refers to any more — a delete pushed
 * from a device that never got to remove the object, or a crash between the
 * two steps of adding one. Only objects older than the grace period: a young
 * one may belong to a row another device created and this one hasn't pulled.
 */
async function sweepOrphans(): Promise<void> {
  const kept = new Set((await engine.listVisible<Attachment>(ATTACHMENTS_SPEC)).map((a) => a.id));
  // A row waiting to be deleted is still a row everywhere else: until the
  // server takes the delete, another device holds the attachment and will
  // want its file. One the server refuses to delete would otherwise lose its
  // file here, an hour on, while every device kept the row.
  for (const id of await engine.getPendingDeletes(ATTACHMENTS_SPEC)) kept.add(id);
  // A household with no attachment at all reads exactly like one whose rows
  // this device has not got yet, and the difference is every file there is.
  if (kept.size === 0) return;
  const cutoff = Date.now() - ATTACHMENT_ORPHAN_MIN_AGE_MS;
  const orphans: string[] = [];
  for (let offset = 0; ; offset += ATTACHMENT_LIST_PAGE) {
    const { data, error } = await bucket().list('', { limit: ATTACHMENT_LIST_PAGE, offset });
    if (error) throw error;
    for (const object of data ?? []) {
      // An object of unknown age is kept: it can only be told stale by its age.
      if (
        !kept.has(object.name) &&
        object.created_at != null &&
        Date.parse(object.created_at) < cutoff
      ) {
        orphans.push(object.name);
      }
    }
    if (!data || data.length < ATTACHMENT_LIST_PAGE) break;
  }
  if (orphans.length === 0) return;
  const { error } = await bucket().remove(orphans);
  if (error) throw error;
}

/** Everything the files need after the tables of `synced` have come down.
 *  Order matters: uploads first so a just-added file is never taken for an
 *  orphan, and the prune before the fetch so nothing is fetched for a row that
 *  is gone. */
export async function syncAttachmentFiles(synced: ReadonlySet<string>): Promise<void> {
  await uploadPending();
  await pruneAttachmentFiles();
  await fetchKeptFiles();
  // What the sweep calls an orphan it reads off the local rows, so it may only
  // run against rows this very run brought down: after a pull that never
  // happened, every file of the household looks like an orphan.
  if (synced.has(ATTACHMENTS_SPEC.table)) await sweepOrphans();
}
