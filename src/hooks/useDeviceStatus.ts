import { useCallback, useEffect, useState } from 'react';
import * as engine from '../lib/offline/engine';
import { listRefusals, type Refusal } from '../lib/offline/sync';
import { attachmentFileUsage, type AttachmentFileUsage } from '../lib/attachmentFiles';
import { deviceStorage, type DeviceStorage } from '../lib/deviceStorage';
import { errorMessage } from '../utils/textUtils';
import { useSyncStatus } from './useSyncStatus';

/** What this device has to say about itself, read in one go so the screen
 *  never shows half of one moment and half of another. */
export interface DeviceStatus {
  /** Changes of every table that have still to go up. */
  pending: number;
  refusals: Refusal[];
  files: AttachmentFileUsage;
  storage: DeviceStorage;
}

/** The device's own numbers, read again whenever a sync run starts or ends —
 *  what a run pushes, brings down and fetches is exactly what they count — and
 *  whenever the screen has done something that changes them. */
export function useDeviceStatus() {
  const [status, setStatus] = useState<DeviceStatus | null>(null);
  const [error, setError] = useState<string | null>(null);
  const { syncing } = useSyncStatus();

  const read = useCallback(async (): Promise<DeviceStatus> => {
    const [counts, refusals, files, storage] = await Promise.all([
      engine.pendingCounts(),
      listRefusals(),
      attachmentFileUsage(),
      deviceStorage(),
    ]);
    return {
      pending: Object.values(counts).reduce((total, n) => total + n, 0),
      refusals,
      files,
      storage,
    };
  }, []);

  useEffect(() => {
    let active = true;
    void (async () => {
      try {
        const next = await read();
        if (active) {
          setStatus(next);
          setError(null);
        }
      } catch (e) {
        if (active) setError(errorMessage(e));
      }
    })();
    return () => {
      active = false;
    };
  }, [read, syncing]);

  const reload = useCallback(async () => {
    try {
      setStatus(await read());
      setError(null);
    } catch (e) {
      setError(errorMessage(e));
    }
  }, [read]);

  return { status, error, reload };
}
