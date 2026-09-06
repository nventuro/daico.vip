// =============================================================================
// What has been opened under the master key, kept for the session so nothing
// is unsealed twice: a statement's contents read for the trends and again on
// its page, a picture drawn as a tile and again full screen. Kept by the row
// and the version of it that was opened, so a row that changes is opened
// again and the version before it is let go of; everything is let go of when
// the key is. What is kept is bounded: the files add up, and a session that
// looks through a folder of pictures must not hold every one — the ones
// opened longest ago go first. Nothing here is ever written anywhere.
// =============================================================================
import type { SyncedRow } from '../types';

/** The most the opened files may weigh together, in bytes: room for a few
 *  PDFs of the largest size or a folder's worth of pictures, and no more
 *  than a phone keeps a tab for. */
export const OPENED_MAX_BYTES = 64 * 1024 * 1024;

interface Opened {
  version: string;
  value: Promise<unknown>;
  /** What the opened thing weighs; 0 for one too small to count. */
  bytes: number;
}

// Insertion order is the order of last use: a hit is re-inserted, so the
// entries go from the least recently used to the most.
const opened = new Map<string, Opened>();
let heldBytes = 0;

function forget(key: string, entry: Opened): void {
  opened.delete(key);
  heldBytes -= entry.bytes;
}

/** Let go of the least recently used files until what is held fits, `keep`
 *  excepted: the one just opened is wanted whatever it weighs. */
function makeRoom(keep: string): void {
  for (const [key, entry] of opened) {
    if (heldBytes <= OPENED_MAX_BYTES) return;
    if (key !== keep && entry.bytes > 0) forget(key, entry);
  }
}

/**
 * What `open` makes of the thing `key` names — `table:id` — at `version`,
 * made once per version. `bytes` is what the opened thing weighs, counted
 * against the bound above; a thing of no weight — a statement's few lines, a
 * pattern — is kept for the session. A failure is not kept, so the next
 * reader tries again.
 */
export function openOnce<T>(
  key: string,
  version: string,
  open: () => Promise<T>,
  bytes = 0,
): Promise<T> {
  const held = opened.get(key);
  if (held && held.version === version) {
    forget(key, held);
    opened.set(key, held);
    heldBytes += held.bytes;
    return held.value as Promise<T>;
  }
  if (held) forget(key, held);
  const value = open();
  const entry: Opened = { version, value, bytes };
  opened.set(key, entry);
  heldBytes += bytes;
  makeRoom(key);
  value.catch(() => {
    if (opened.get(key) === entry) forget(key, entry);
  });
  return value;
}

/** `openOnce` for a synced row: once per `updated_at` of it. */
export function openRowOnce<T>(table: string, row: SyncedRow, open: () => Promise<T>): Promise<T> {
  return openOnce(`${table}:${row.id}`, row.updated_at, open);
}

/** Forget everything opened, for when the key goes. */
export function forgetOpened(): void {
  opened.clear();
  heldBytes = 0;
}
