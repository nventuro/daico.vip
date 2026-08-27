import { useCallback, useMemo } from 'react';
import { ATTACHMENT_FILE_TYPES, ATTACHMENT_MAX_BYTES, type Attachment } from '../../types';
import { ATTACHMENTS_SPEC } from '../../lib/offline/specs';
import * as engine from '../../lib/offline/engine';
import { encryptFile } from '../../lib/householdKey';
import { removeAttachmentObject } from '../../lib/attachmentFiles';
import { useOfflineTable } from '../../hooks/useOfflineTable';
import { formatBytes, lowercaseTrimmed } from '../../utils/textUtils';

/** Why `file` cannot be attached, in the user's words, or null when it can. */
export function attachmentProblem(file: File): string | null {
  if (!(file.type in ATTACHMENT_FILE_TYPES)) {
    return 'Solo se pueden adjuntar imágenes (JPG, PNG, WebP, GIF) o PDF.';
  }
  if (file.size > ATTACHMENT_MAX_BYTES) {
    return `El archivo pesa ${formatBytes(file.size)}; el máximo es ${formatBytes(ATTACHMENT_MAX_BYTES)}.`;
  }
  return null;
}

/**
 * Local-first attachments of chores: every chore's when `choreId` is not given,
 * one chore's otherwise. Adding encrypts the file under `masterKey` and keeps
 * it here until the next sync uploads it; removing takes the row, the local
 * file and (best effort) the bucket's object.
 */
export function useAttachments(choreId?: string) {
  const { items: all, loading, error, mutate } = useOfflineTable<Attachment>(ATTACHMENTS_SPEC);

  const items = useMemo(
    () =>
      choreId === undefined
        ? all
        : all.filter((a) => a.owner_kind === 'chore' && a.owner_id === choreId),
    [all, choreId],
  );

  const add = useCallback(
    (ownerId: string, file: File, name: string, masterKey: CryptoKey) =>
      mutate(async () => {
        const { data, wrappedFileKey } = await encryptFile(
          masterKey,
          new Uint8Array(await file.arrayBuffer()),
        );
        // The file first, under the id the row will carry: a crash in between
        // leaves an orphan file to prune, never a row with nothing to show.
        const id = crypto.randomUUID();
        await engine.putAttachmentFile(id, data, false);
        return engine.insert(
          ATTACHMENTS_SPEC,
          {
            owner_kind: 'chore',
            owner_id: ownerId,
            name: lowercaseTrimmed(name),
            mime: file.type,
            size: file.size,
            wrapped_file_key: wrappedFileKey,
          },
          id,
        );
      }),
    [mutate],
  );

  const remove = useCallback(
    (attachment: Attachment) =>
      mutate(async () => {
        await engine.remove(ATTACHMENTS_SPEC, attachment.id);
        await engine.deleteAttachmentFile(attachment.id);
        void removeAttachmentObject(attachment.id);
      }),
    [mutate],
  );

  return { items, loading, error, add, remove };
}
