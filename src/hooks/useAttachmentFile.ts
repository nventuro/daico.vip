import { useEffect, useState } from 'react';
import { ATTACHMENT_FILE_TYPES, fetchAttachmentFile } from '../lib/attachmentFiles';
import type { Attachment } from '../lib/offline/specs';
import { decryptFile } from '../lib/householdKey';
import { useMasterKey } from './useMasterKey';

/** An attachment's file as the page can use it, once it can. */
export type AttachmentFileView =
  | { status: 'loading' }
  /** No copy here and none to fetch right now (no connection, or not uploaded yet). */
  | { status: 'unavailable' }
  | { status: 'ready'; file: File };

/**
 * The attachment decrypted into a File, named as it should be outside the
 * app: the copy on this device, fetched from the bucket when there is none.
 */
export function useAttachmentFile(attachment: Attachment | undefined): AttachmentFileView {
  const masterKey = useMasterKey();
  const key = masterKey.status === 'unlocked' ? masterKey.key : null;
  const [view, setView] = useState<AttachmentFileView>({ status: 'loading' });

  useEffect(() => {
    if (!attachment || !key) return;
    let active = true;
    (async () => {
      const data = await fetchAttachmentFile(attachment.id);
      if (!active) return;
      if (!data) {
        setView({ status: 'unavailable' });
        return;
      }
      const plain = await decryptFile(key, attachment.wrapped_file_key, data);
      if (!active) return;
      const extension = ATTACHMENT_FILE_TYPES[attachment.mime] ?? '';
      const file = new File([plain], `${attachment.name || 'adjunto'}.${extension}`, {
        type: attachment.mime,
      });
      setView({ status: 'ready', file });
    })().catch(() => {
      if (active) setView({ status: 'unavailable' });
    });
    return () => {
      active = false;
    };
  }, [attachment, key]);

  return view;
}
