import { generateKeyBetween } from 'fractional-indexing';

/** Minimal shape the ordering helpers need: a row with its fractional sort key. */
export interface Positioned {
  id: string;
  position: string | null;
}

/**
 * A sort key strictly between `before` and `after` (either may be null for an
 * open end), in the base-62 fractional-indexing scheme. Used for manual drag
 * ordering of the shopping list.
 *
 * Reordering an item writes only that one row's key, so it stays a single-row,
 * last-write-wins-friendly change — unlike integer positions, which would
 * renumber neighbours and fan out across rows.
 *
 * Keys grow by ~1 char only when an item is repeatedly inserted into the *same*
 * gap; since new items are appended at the end, that effectively never happens at
 * this app's scale, so we deliberately don't rebalance. If keys ever did grow
 * unwieldy, the remedy is a one-off rewrite of every active row's key to evenly
 * spaced short keys (a rare multi-row write).
 */
export function positionBetween(before: string | null, after: string | null): string {
  return generateKeyBetween(before, after);
}

/** Move element `from` → `to`, returning a new array (matches dnd-kit's arrayMove). */
function arrayMove<T>(items: T[], from: number, to: number): T[] {
  const copy = items.slice();
  const [moved] = copy.splice(from, 1);
  copy.splice(to, 0, moved);
  return copy;
}

/**
 * The key for a new item appended after the last of `items`, which must already
 * be in visible (sort-key) order. An empty list yields the first key.
 */
export function keyForAppend(items: Positioned[]): string {
  const last = items.length ? items[items.length - 1].position : null;
  return positionBetween(last, null);
}

/**
 * The new key for item `fromId` after it's dropped onto `toId`'s slot, given the
 * list in its current visible order. Returns null when the move is a no-op
 * (dropped on itself, or either id is missing) or when a valid key can't be
 * minted — duplicate (equal) or corrupt neighbour keys make the generator throw,
 * so we bail and leave the order untouched rather than crash mid-drag.
 */
export function keyForMove(items: Positioned[], fromId: string, toId: string): string | null {
  if (fromId === toId) return null;
  const from = items.findIndex((i) => i.id === fromId);
  const to = items.findIndex((i) => i.id === toId);
  if (from === -1 || to === -1) return null;

  const reordered = arrayMove(items, from, to);
  const before = to > 0 ? reordered[to - 1].position : null;
  const after = to < reordered.length - 1 ? reordered[to + 1].position : null;
  try {
    return positionBetween(before, after);
  } catch {
    return null;
  }
}
