import { useSyncExternalStore } from 'react';
import { isUpdateWaiting, subscribeUpdate } from '../lib/appUpdate';

/** Whether a version newer than the running one is downloaded and waiting. */
export function useUpdateWaiting(): boolean {
  return useSyncExternalStore(subscribeUpdate, isUpdateWaiting, isUpdateWaiting);
}
