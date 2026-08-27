// =============================================================================
// Where this device keeps the unwrapped master key: IndexedDB, which can hold a
// CryptoKey as-is — non-extractable stays non-extractable, so page code can use
// the key from here but never read its bytes. Scoped to this origin like every
// other store. Nothing else lives in this database.
// =============================================================================
import { MASTER_KEY_DB, MASTER_KEY_STORE } from '../types';

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
export async function loadMasterKey(): Promise<CryptoKey | null> {
  try {
    const key = await withStore('readonly', (store) => store.get(MASTER_KEY_ID));
    return key instanceof CryptoKey ? key : null;
  } catch {
    // No IndexedDB (a private window that blocks it): the device simply holds no key.
    return null;
  }
}

export async function saveMasterKey(key: CryptoKey): Promise<void> {
  await withStore('readwrite', (store) => store.put(key, MASTER_KEY_ID));
}

export async function deleteMasterKey(): Promise<void> {
  try {
    await withStore('readwrite', (store) => store.delete(MASTER_KEY_ID));
  } catch {
    // Nothing to delete where nothing could be stored.
  }
}
