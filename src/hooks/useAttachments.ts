import { useCallback, useMemo } from 'react';
import { ATTACHMENTS_SPEC, type Attachment } from '../lib/offline/specs';
import type { AttachmentOwner, AttachmentOwnerKind } from '../types';
import * as engine from '../lib/offline/engine';
import { encryptFile, rowBinding } from '../lib/householdKey';
import {
  attachmentProblem,
  attachmentSizeProblem,
  attachmentType,
  deleteAttachmentFile,
  putAttachmentFile,
} from '../lib/attachmentFiles';
import { useOfflineTable } from './useOfflineTable';
import { lowercaseTrimmed } from '../utils/textUtils';

/** A file as it is attached: what it is called, what it is, and its bytes in
 *  the clear, to be sealed under the attachment it becomes. */
export interface AttachmentSource {
  name: string;
  mime: string;
  /** Of the file itself, in bytes. */
  size: number;
  plain: Uint8Array;
}

/** The entries of `kind` that have at least one attachment — what tells a row
 *  with attachments from one without, wherever it is listed. */
export function ownersWithAttachments(
  attachments: Attachment[],
  kind: AttachmentOwnerKind,
): Set<string> {
  return new Set(attachments.filter((a) => a.owner_kind === kind).map((a) => a.owner_id));
}

/** `source` sealed under `masterKey` for a fresh attachment of `owner`'s,
 *  kept here until the next sync uploads it; resolves the new id. */
async function addAttachment(
  owner: AttachmentOwner,
  source: AttachmentSource,
  masterKey: CryptoKey,
): Promise<string> {
  const problem = attachmentSizeProblem(source.size);
  if (problem) throw new Error(problem);
  // The id first: the file is sealed for the row it will be in, and kept
  // under that id before the row exists, so a crash in between leaves an
  // orphan file to prune, never a row with nothing to show.
  const id = crypto.randomUUID();
  const { data, wrappedFileKey } = await encryptFile(
    masterKey,
    source.plain,
    rowBinding(ATTACHMENTS_SPEC.table, id),
  );
  await putAttachmentFile(id, data, false);
  return engine.insert(
    ATTACHMENTS_SPEC,
    {
      owner_kind: owner.kind,
      owner_id: owner.id,
      name: lowercaseTrimmed(source.name),
      mime: source.mime,
      size: source.size,
      wrapped_file_key: wrappedFileKey,
    },
    id,
  );
}

/** The row and this device's copy of the file. The bucket's object is the
 *  sweep's to take, once the delete has been pushed: taken now, another
 *  device that still held the row would find its file gone — for good, if
 *  the delete were then refused. */
async function removeAttachment(id: string): Promise<void> {
  await engine.remove(ATTACHMENTS_SPEC, id);
  await deleteAttachmentFile(id);
}

/**
 * Local-first attachments: every entry's when `owner` is not given, one
 * entry's otherwise. Adding (to `owner`) encrypts the file under
 * `masterKey` and keeps it here until the next sync uploads it; removing
 * takes the row and the local file, and leaves the bucket's object to the
 * sweep.
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
        const problem = attachmentProblem(file);
        if (problem) throw new Error(problem);
        const mime = attachmentType(file);
        if (!mime) throw new Error('No se pudo adjuntar el archivo.');
        const plain = new Uint8Array(await file.arrayBuffer());
        return addAttachment(
          { kind, id: ownerId },
          { name, mime, size: file.size, plain },
          masterKey,
        );
      }),
    [mutate, kind, ownerId],
  );

  /** Attach a file already in hand as bytes to `owner`, whichever entry that
   *  is: what a staged PDF becomes at confirm. Returns the new attachment's
   *  id, or undefined when it could not be added. */
  const addOpened = useCallback(
    (owner: AttachmentOwner, source: AttachmentSource, masterKey: CryptoKey) =>
      mutate(() => addAttachment(owner, source, masterKey)),
    [mutate],
  );

  const remove = useCallback(
    (attachment: Attachment) => mutate(() => removeAttachment(attachment.id)),
    [mutate],
  );

  /** Take every attachment of this entry at once, for an entry being deleted:
   *  nothing else would ever list them. */
  const removeAll = useCallback(
    () =>
      mutate(async () => {
        for (const attachment of items) await removeAttachment(attachment.id);
      }),
    [mutate, items],
  );

  /** Take the attachments with these ids, whoever's they are: for an undo
   *  that knows what it added by id, and may run before `items` has been
   *  read. */
  const removeByIds = useCallback(
    (ids: string[]) =>
      mutate(async () => {
        for (const id of ids) await removeAttachment(id);
      }),
    [mutate],
  );

  return { items, loading, error, add, addOpened, remove, removeAll, removeByIds };
}
