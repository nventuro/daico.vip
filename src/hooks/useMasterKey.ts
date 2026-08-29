import { useSyncExternalStore } from 'react';
import { getMasterKeyState, subscribeMasterKey, type MasterKeyState } from '../lib/masterKeyStore';

export type { MasterKeyState };

/** The master key state, kept current as the device unlocks or locks. */
export function useMasterKey(): MasterKeyState {
  return useSyncExternalStore(subscribeMasterKey, getMasterKeyState, getMasterKeyState);
}
