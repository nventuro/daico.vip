import { useEffect, useState } from 'react';
import * as engine from '../../lib/offline/engine';

/** Where this device's copy of an attachment's file stands with the bucket,
 *  kept current; null when the device holds no copy. */
export function useAttachmentUploadState(id: string): engine.AttachmentUploadState | null {
  const [state, setState] = useState<engine.AttachmentUploadState | null>(null);

  useEffect(() => {
    let active = true;
    const load = () =>
      engine.getAttachmentUploadState(id).then((next) => {
        if (active) setState(next);
      });
    void load();
    const stop = engine.subscribe(engine.ATTACHMENT_FILES_TABLE, () => void load());
    return () => {
      active = false;
      stop();
    };
  }, [id]);

  return state;
}
