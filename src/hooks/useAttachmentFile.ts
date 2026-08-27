import { useEffect, useState } from 'react';
import { ATTACHMENT_FILE_TYPES, type Attachment } from '../types';
import { decryptFile } from '../lib/householdKey';
import { fetchAttachmentFile } from '../lib/attachmentFiles';
import * as engine from '../lib/offline/engine';
import { useMasterKey } from './useMasterKey';

/** An attachment's file as the page can use it, once it can. */
export type AttachmentFileView =
  | { status: 'loading' }
  /** No copy here and none to fetch right now (no connection, or not uploaded yet). */
  | { status: 'unavailable' }
  | { status: 'ready'; file: File };

/**
 * The attachment decrypted into a File, named as it should be outside the app.
 * `fetch` false only uses a copy already on this device (a tile that must not
 * download megabytes just to draw itself); true fetches from the bucket when
 * there is none.
 */
export function useAttachmentFile(
  attachment: Attachment | undefined,
  fetch: boolean,
): AttachmentFileView {
  const masterKey = useMasterKey();
  const key = masterKey.status === 'unlocked' ? masterKey.key : null;
  const [view, setView] = useState<AttachmentFileView>({ status: 'loading' });

  useEffect(() => {
    if (!attachment || !key) return;
    let active = true;
    (async () => {
      const data = fetch
        ? await fetchAttachmentFile(attachment.id)
        : await engine.getAttachmentFile(attachment.id);
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
  }, [attachment, key, fetch]);

  return view;
}
