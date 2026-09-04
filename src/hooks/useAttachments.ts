import { useCallback, useMemo } from 'react';
import { ATTACHMENTS_SPEC, type Attachment } from '../lib/offline/specs';
import type { AttachmentOwner, AttachmentOwnerKind } from '../types';
import * as engine from '../lib/offline/engine';
import { encryptFile } from '../lib/householdKey';
import {
  attachmentProblem,
  attachmentType,
  deleteAttachmentFile,
  putAttachmentFile,
  removeAttachmentObject,
} from '../lib/attachmentFiles';
import { useOfflineTable } from './useOfflineTable';
import { lowercaseTrimmed } from '../utils/textUtils';

/** A file already sealed in the attachment format, its key wrapped under the
 *  master key: what a file sealed outside the app becomes once re-keyed. */
export interface SealedAttachment {
  name: string;
  mime: string;
  /** Of the file itself, before sealing, in bytes. */
  size: number;
  data: Uint8Array;
  wrappedFileKey: string;
}

/** The entries of `kind` that have at least one attachment — what tells a row
 *  with attachments from one without, wherever it is listed. */
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
 * entry's otherwise. Adding (to `owner`) encrypts the file under
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
          throw new Error('No se puede adjuntar nada sin una entrada.');
        }
        const mime = attachmentType(file);
        if (!mime) throw new Error(attachmentProblem(file) ?? 'No se pudo adjuntar el archivo.');
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

  /** Keep a file that is already sealed, under a row of its own on `owner`:
   *  the bytes go in as they are, waiting for the next sync to upload them.
   *  Returns the new attachment's id, or undefined when it could not be added. */
  const addSealed = useCallback(
    (owner: AttachmentOwner, file: SealedAttachment) =>
      mutate(async () => {
        const id = crypto.randomUUID();
        await putAttachmentFile(id, file.data, false);
        return engine.insert(
          ATTACHMENTS_SPEC,
          {
            owner_kind: owner.kind,
            owner_id: owner.id,
            name: lowercaseTrimmed(file.name),
            mime: file.mime,
            size: file.size,
            wrapped_file_key: file.wrappedFileKey,
          },
          id,
        );
      }),
    [mutate],
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

  return { items, loading, error, add, addSealed, remove, removeAll };
}
