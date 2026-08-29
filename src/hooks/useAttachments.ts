import { useCallback, useMemo } from 'react';
import { ATTACHMENTS_SPEC, type Attachment } from '../lib/offline/specs';
import type { AttachmentOwner, AttachmentOwnerKind } from '../types';
import * as engine from '../lib/offline/engine';
import { encryptFile } from '../lib/householdKey';
import {
  attachmentType,
  deleteAttachmentFile,
  putAttachmentFile,
  removeAttachmentObject,
} from '../lib/attachmentFiles';
import { useOfflineTable } from './useOfflineTable';
import { lowercaseTrimmed } from '../utils/textUtils';

/** The entries of `kind` that have at least one attachment — what tells a row
 *  with pictures from one without, wherever it is listed. */
export function ownersWithAttachments(
  attachments: Attachment[],
  kind: AttachmentOwnerKind,
): Set<string> {
  return new Set(attachments.filter((a) => a.owner_kind === kind).map((a) => a.owner_id));
}

/** The row, this device's copy of the file, and (best effort) the bucket's
 *  object. */
async function removeAttachment(attachment: Attachment): Promise<void> {
  await engine.remove(ATTACHMENTS_SPEC, attachment.id);
  await deleteAttachmentFile(attachment.id);
  void removeAttachmentObject(attachment.id);
}

/**
 * Local-first attachments: every entry's when `owner` is not given, one
 * entry's otherwise. Adding (to `owner`) encrypts the picture under
 * `masterKey` and keeps it here until the next sync uploads it; removing
 * takes the row, the local file and (best effort) the bucket's object.
 */
export function useAttachments(owner?: AttachmentOwner) {
  const { items: all, loading, error, mutate } = useOfflineTable<Attachment>(ATTACHMENTS_SPEC);
  const kind = owner?.kind;
  const ownerId = owner?.id;

  const items = useMemo(
    () =>
      kind === undefined ? all : all.filter((a) => a.owner_kind === kind && a.owner_id === ownerId),
    [all, kind, ownerId],
  );

  // Returns the new attachment's id, or undefined when it could not be added.
  const add = useCallback(
    (file: File, masterKey: CryptoKey, name: string) =>
      mutate(async () => {
        if (kind === undefined || ownerId === undefined) {
          throw new Error('An attachment needs an entry to belong to');
        }
        const mime = attachmentType(file);
        if (!mime) throw new Error(`Unsupported attachment type ${file.type}`);
        const { data, wrappedFileKey } = await encryptFile(
          masterKey,
          new Uint8Array(await file.arrayBuffer()),
        );
        // The file first, under the id the row will carry: a crash in between
        // leaves an orphan file to prune, never a row with nothing to show.
        const id = crypto.randomUUID();
        await putAttachmentFile(id, data, false);
        return engine.insert(
          ATTACHMENTS_SPEC,
          {
            owner_kind: kind,
            owner_id: ownerId,
            name: lowercaseTrimmed(name),
            mime,
            size: file.size,
            wrapped_file_key: wrappedFileKey,
          },
          id,
        );
      }),
    [mutate, kind, ownerId],
  );

  const remove = useCallback(
    (attachment: Attachment) => mutate(() => removeAttachment(attachment)),
    [mutate],
  );

  /** Take every attachment of this entry at once, for an entry being deleted:
   *  nothing else would ever list them. */
  const removeAll = useCallback(
    () =>
      mutate(async () => {
        for (const attachment of items) await removeAttachment(attachment);
      }),
    [mutate, items],
  );

  return { items, loading, error, add, remove, removeAll };
}
