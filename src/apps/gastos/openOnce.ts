import type { SyncedRow } from '../../types';

// Keyed by the row and the moment it was last written, so a row that changes
// is opened again and one that does not never is.
const opened = new Map<string, Promise<unknown>>();

/**
 * What `open` makes of a row, made once per version of it: returning to a
 * statement, or reading every statement for the trends, never unseals the same
 * payload twice. A failure is not kept, so the next reader tries again.
 */
export function openOnce<T>(row: SyncedRow, open: () => Promise<T>): Promise<T> {
  const key = `${row.id}:${row.updated_at}`;
  const held = opened.get(key) as Promise<T> | undefined;
  if (held) return held;
  const promise = open();
  opened.set(key, promise);
  promise.catch(() => opened.delete(key));
  return promise;
}
