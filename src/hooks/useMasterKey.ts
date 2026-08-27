import { useSyncExternalStore } from 'react';
import { deleteMasterKey, loadMasterKey, saveMasterKey } from '../lib/masterKeyStore';

/** This device's hold on the household's master key: unknown until the store
 *  has been read, then either absent (the phrase gate applies) or in hand. */
export type MasterKeyState =
  { status: 'loading' } | { status: 'locked' } | { status: 'unlocked'; key: CryptoKey };

// One state for the whole app: the gate, the attachment screens and the file
// sync all read the same key, and unlocking anywhere unlocks everywhere.
let state: MasterKeyState = { status: 'loading' };
let loading = false;
const listeners = new Set<() => void>();

function set(next: MasterKeyState): void {
  state = next;
  listeners.forEach((listener) => listener());
}

function load(): void {
  if (loading) return;
  loading = true;
  loadMasterKey().then((key) => set(key ? { status: 'unlocked', key } : { status: 'locked' }));
}

function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  load();
  return () => {
    listeners.delete(listener);
  };
}

/** The master key state, kept current as the device unlocks or locks. */
export function useMasterKey(): MasterKeyState {
  return useSyncExternalStore(subscribe, () => state);
}

/** The master key in hand right now, for code outside React; null while locked. */
export function currentMasterKey(): CryptoKey | null {
  return state.status === 'unlocked' ? state.key : null;
}

/** Keep `key` on this device and unlock. */
export async function setMasterKey(key: CryptoKey): Promise<void> {
  await saveMasterKey(key);
  set({ status: 'unlocked', key });
}

/** Forget the key: the device is locked until the phrase is typed again. */
export async function clearMasterKey(): Promise<void> {
  await deleteMasterKey();
  set({ status: 'locked' });
}
