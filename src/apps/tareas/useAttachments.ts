import { useCallback, useMemo } from 'react';
import { ATTACHMENT_FILE_TYPES, ATTACHMENT_MAX_BYTES, type Attachment } from '../../types';
import { ATTACHMENTS_SPEC } from '../../lib/offline/specs';
import * as engine from '../../lib/offline/engine';
import { encryptFile } from '../../lib/householdKey';
import { removeAttachmentObject } from '../../lib/attachmentFiles';
import { useOfflineTable } from '../../hooks/useOfflineTable';
import { formatBytes, lowercaseTrimmed } from '../../utils/textUtils';

/**
 * The attachment MIME type for `file`, or null when it is not one we take.
 * Trusts `file.type` when it is one of ours; otherwise falls back to the
 * filename extension, since some devices report `image/jpg` or no type at all
 * for a perfectly good picture.
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

  // Adds the attachment the moment the file is picked (before it is named), so
  // the file is safely stored and shown at once and nothing depends on state
  // surviving the trip through the device's file picker, which on some phones
  // reloads the app. The name is set afterwards, on its own screen.
  const add = useCallback(
    (ownerId: string, file: File, masterKey: CryptoKey) =>
      mutate(async () => {
        const mime = attachmentType(file);
        if (!mime) throw new Error(`Unsupported attachment type ${file.type}`);
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
            name: '',
            mime,
            size: file.size,
            wrapped_file_key: wrappedFileKey,
          },
          id,
        );
      }),
    [mutate],
  );

  const rename = useCallback(
    (id: string, name: string) =>
      mutate(() => engine.update(ATTACHMENTS_SPEC, id, { name: lowercaseTrimmed(name) })),
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

  return { items, loading, error, add, rename, remove };
}
