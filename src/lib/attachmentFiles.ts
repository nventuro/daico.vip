// =============================================================================
// The attachment files' side of sync. Rows travel with the tables; the files
// go to and from the storage bucket here, one at a time:
//
//   - a file added on this device is uploaded once there is a connection;
//   - a file opened on this device is downloaded once and kept;
//   - every document's files are fetched and kept, so a document can be seen
//     with no connection wherever it was added;
//   - after a sync, files of rows that are gone are dropped here, and objects
//     in the bucket that no row refers to any more are removed there.
//
// Everything goes over the bucket as the opaque encrypted blob it is; the
// keys never come near this module.
// =============================================================================
import {
  ATTACHMENT_LIST_PAGE,
  ATTACHMENT_ORPHAN_MIN_AGE_MS,
  ATTACHMENTS_BUCKET,
  type Attachment,
} from '../types';
import { supabase } from './supabase';
import { isPermanentStatus } from './refusals';
import * as engine from './offline/engine';
import { ATTACHMENTS_SPEC } from './offline/specs';
import { reportFiles } from './offline/sync';

const bucket = () => supabase.storage.from(ATTACHMENTS_BUCKET);

/** The HTTP status a failed storage call reports, when it got as far as the server. */
function statusOf(error: { message: string }): number | undefined {
  return 'status' in error && typeof error.status === 'number' ? error.status : undefined;
}

/** Send every file still waiting for the bucket. Stops at the first refusal
 *  that may pass later, leaving that file and the rest for the next run. */
export async function uploadPending(): Promise<void> {
  for (const { id, data } of await engine.listPendingUploads()) {
    const { error } = await bucket().upload(id, new Blob([data]), {
      contentType: 'application/octet-stream',
      upsert: false,
    });
    if (!error) {
      await engine.markAttachmentUploaded(id);
      continue;
    }
    const status = statusOf(error);
    // Already there: an earlier attempt went through before its answer was lost.
    if (status === 409) {
      await engine.markAttachmentUploaded(id);
      continue;
    }
    if (isPermanentStatus(status)) {
      await engine.markAttachmentUploadFailed(id, error.message);
      continue;
    }
    throw error;
  }
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
  const local = await engine.getAttachmentFile(id);
  if (local) return local;
  if (!navigator.onLine) return null;
  let bytes: Uint8Array | null;
  try {
    bytes = await downloadObject(id);
  } catch {
    return null;
  }
  if (!bytes) return null;
  await engine.putAttachmentFile(id, bytes, true);
  return bytes;
}

/**
 * Fetch every document's file this device lacks, so a document can be seen
 * with no connection wherever it was added. One the bucket does not have yet
 * is left for a later run; a failure that may pass later stops the run, with
 * the rest left for the next.
 */
async function fetchDocumentFiles(): Promise<void> {
  const held = new Set(await engine.listAttachmentFileIds());
  const missing = (await engine.listVisible<Attachment>(ATTACHMENTS_SPEC)).filter(
    (attachment) => attachment.owner_kind === 'document' && !held.has(attachment.id),
  );
  reportFiles(0, missing.length);
  let done = 0;
  for (const attachment of missing) {
    const bytes = await downloadObject(attachment.id);
    if (bytes) await engine.putAttachmentFile(attachment.id, bytes, true);
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
  await engine.pruneAttachmentFiles();
  await fetchDocumentFiles();
  // What the sweep calls an orphan it reads off the local rows, so it may only
  // run against rows this very run brought down: after a pull that never
  // happened, every file of the household looks like an orphan.
  if (synced.has(ATTACHMENTS_SPEC.table)) await sweepOrphans();
}
