// =============================================================================
// Where this device keeps the unwrapped master key: IndexedDB, which can hold a
// CryptoKey as-is — non-extractable stays non-extractable, so page code can use
// the key from here but never read its bytes. Scoped to this origin like every
// other store. Nothing else lives in this database.
//
// One state for the whole app sits on top of it: the gate, the attachment
// screens and the file sync all read the same key, and unlocking anywhere
// unlocks everywhere. `useMasterKey` is how a screen reads it.
// =============================================================================
/** IndexedDB database and store holding this device's unwrapped master key. */
const MASTER_KEY_DB = 'daico-keys';
const MASTER_KEY_STORE = 'keys';

const MASTER_KEY_ID = 'master';

function done<T>(request: IDBRequest<T>): Promise<T> {
  return new Promise((resolve, reject) => {
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

function open(): Promise<IDBDatabase> {
  const request = indexedDB.open(MASTER_KEY_DB, 1);
  request.onupgradeneeded = () => request.result.createObjectStore(MASTER_KEY_STORE);
  return done(request);
}

async function withStore<T>(
  mode: IDBTransactionMode,
  run: (store: IDBObjectStore) => IDBRequest<T>,
): Promise<T> {
  const db = await open();
  try {
    return await done(run(db.transaction(MASTER_KEY_STORE, mode).objectStore(MASTER_KEY_STORE)));
  } finally {
    db.close();
  }
}

/** The master key kept on this device, or null when it has none. */
async function loadMasterKey(): Promise<CryptoKey | null> {
  try {
    const key = await withStore('readonly', (store) => store.get(MASTER_KEY_ID));
    return key instanceof CryptoKey ? key : null;
  } catch {
    // No IndexedDB (a private window that blocks it): the device simply holds no key.
    return null;
  }
}

async function saveMasterKey(key: CryptoKey): Promise<void> {
  await withStore('readwrite', (store) => store.put(key, MASTER_KEY_ID));
}

async function deleteMasterKey(): Promise<void> {
  try {
    await withStore('readwrite', (store) => store.delete(MASTER_KEY_ID));
  } catch {
    // Nothing to delete where nothing could be stored.
  }
}

/** This device's hold on the household's master key: unknown until the store
 *  has been read, then either absent (the phrase gate applies) or in hand. */
export type MasterKeyState =
  { status: 'loading' } | { status: 'locked' } | { status: 'unlocked'; key: CryptoKey };

let state: MasterKeyState = { status: 'loading' };
let loading = false;
const listeners = new Set<() => void>();

function set(next: MasterKeyState): void {
  state = next;
  listeners.forEach((listener) => listener());
}

/** The master key state right now, for code outside React. */
export function getMasterKeyState(): MasterKeyState {
  return state;
}

/** Run `listener` on every change of the master key state; returns the
 *  unsubscribe. Reading the store starts on the first subscription. */
export function subscribeMasterKey(listener: () => void): () => void {
  listeners.add(listener);
  if (!loading) {
    loading = true;
    void loadMasterKey().then((key) =>
      set(key ? { status: 'unlocked', key } : { status: 'locked' }),
    );
  }
  return () => {
    listeners.delete(listener);
  };
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
