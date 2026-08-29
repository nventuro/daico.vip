import { useEffect, useState } from 'react';
import * as engine from '../lib/offline/engine';
import { ATTACHMENT_FILES } from '../lib/offline/localTables';
import { attachmentUploadState, type AttachmentUploadState } from '../lib/attachmentFiles';

/** Where this device's copy of an attachment's file stands with the bucket,
 *  kept current; null when the device holds no copy. */
export function useAttachmentUploadState(id: string): AttachmentUploadState | null {
  const [state, setState] = useState<AttachmentUploadState | null>(null);

  useEffect(() => {
    let active = true;
    const load = () =>
      attachmentUploadState(id).then((next) => {
        if (active) setState(next);
      });
    void load();
    const stop = engine.subscribe(ATTACHMENT_FILES.table, () => void load());
    return () => {
      active = false;
      stop();
    };
  }, [id]);

  return state;
}
