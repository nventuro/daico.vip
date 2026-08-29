// =============================================================================
// Single-tab ownership of the local database.
//
// The VFS the local database is opened through allows a single connection per
// origin. This module elects one owning tab with a Web Lock so a second tab can
// be shown a friendly notice instead of silently failing. It deliberately
// depends on nothing from the store (no SQLocal), so the app shell can gate on
// ownership without pulling it into its bundle.
// =============================================================================
/** Web Locks name held for a tab's lifetime by whichever tab owns the local
 *  database. */
export const DB_OWNER_LOCK = 'daico-db-owner';

/**
 * Thrown when the local database can't be opened because another tab already
 * owns it. The UI surfaces this as an "already open in another tab" notice, not
 * a hard error.
 */
export class MultiTabError extends Error {
  constructor() {
    super('The local database is already open in another tab.');
    this.name = 'MultiTabError';
  }
}

let ownership: Promise<boolean> | null = null;

/**
 * Whether this tab owns the local database. The first tab to ask acquires an
 * exclusive Web Lock and holds it for its whole lifetime (the request callback
 * never returns), so a second tab resolves false and stays that way until a tab
 * closes and the page reloads. Resolves true where the Web Locks API is absent:
 * the VFS would still reject a real second connection, so correctness does not
 * depend on the lock, only the friendlier notice does.
 */
export function checkDbOwnership(): Promise<boolean> {
  if (!ownership) {
    ownership = new Promise<boolean>((resolve) => {
      if (typeof navigator === 'undefined' || !navigator.locks) {
        resolve(true);
        return;
      }
      navigator.locks
        .request(DB_OWNER_LOCK, { mode: 'exclusive', ifAvailable: true }, (lock) => {
          resolve(lock !== null);
          // Hold the lock for the tab's lifetime once acquired; release it
          // (return) when it wasn't, so the queue isn't blocked.
          return lock ? new Promise<never>(() => {}) : undefined;
        })
        .catch(() => resolve(true));
    });
  }
  return ownership;
}
