import { useEffect, useState } from 'react';
import { ATTACHMENT_FILE_TYPES, fetchAttachmentFile } from '../lib/attachmentFiles';
import { ATTACHMENTS_SPEC, type Attachment } from '../lib/offline/specs';
import { decryptFile, rowBinding } from '../lib/householdKey';
import { openOnce } from '../lib/opened';
import { useMasterKey } from './useMasterKey';

/** An attachment's file as the page can use it, once it can. */
export type AttachmentFileView =
  | { status: 'loading' }
  /** No copy here and none to fetch right now (no connection, or not uploaded yet). */
  | { status: 'unavailable' }
  | { status: 'ready'; file: File };

/** Thrown for a file that cannot be had right now, so nothing is kept of the
 *  attempt and the next one fetches again. */
class Unavailable extends Error {}

/**
 * The attachment decrypted into a File, named as it should be outside the
 * app: the copy on this device, fetched from the bucket when there is none.
 * Opened once per attachment while it is among the files kept open, however
 * many times its row is read again — a sync hands out new row objects for
 * rows that did not change — and however many screens draw it.
 */
export function useAttachmentFile(attachment: Attachment | undefined): AttachmentFileView {
  const masterKey = useMasterKey();
  const key = masterKey.status === 'unlocked' ? masterKey.key : null;
  const [view, setView] = useState<AttachmentFileView>({ status: 'loading' });
  const id = attachment?.id;
  const wrappedKey = attachment?.wrapped_file_key;
  const name = attachment?.name;
  const mime = attachment?.mime;
  const size = attachment?.size;

  useEffect(() => {
    if (id === undefined || wrappedKey === undefined || mime === undefined || !key) return;
    let active = true;
    openOnce(
      `${ATTACHMENTS_SPEC.table}:${id}`,
      wrappedKey,
      async () => {
        const data = await fetchAttachmentFile(id);
        if (!data) throw new Unavailable();
        return decryptFile(key, wrappedKey, data, rowBinding(ATTACHMENTS_SPEC.table, id));
      },
      size,
    ).then(
      (plain) => {
        if (!active) return;
        const extension = ATTACHMENT_FILE_TYPES[mime] ?? '';
        const file = new File([plain], `${name || 'adjunto'}.${extension}`, { type: mime });
        setView({ status: 'ready', file });
      },
      () => {
        if (active) setView({ status: 'unavailable' });
      },
    );
    return () => {
      active = false;
    };
  }, [id, wrappedKey, name, mime, size, key]);

  return view;
}
