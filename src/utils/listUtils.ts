import type { SyncedRow } from '../types';

/**
 * Consecutive runs of items sharing a key, in the order they were given: a
 * list already sorted the way it is shown, cut where the key changes. What
 * heads a run is the caller's to make from its key and its items.
 */
export function groupRuns<T>(
  items: T[],
  keyOf: (item: T) => string,
): { key: string; items: T[] }[] {
  const runs: { key: string; items: T[] }[] = [];
  for (const item of items) {
    const key = keyOf(item);
    const last = runs.at(-1);
    if (last?.key === key) last.items.push(item);
    else runs.push({ key, items: [item] });
  }
  return runs;
}

/** How titles and group names are ordered: in the household's language, so an
 *  accented name sits where a person would look for it rather than after the
 *  z, and a capital beside its lower case. */
const nameCollator = new Intl.Collator('es', { sensitivity: 'base' });

/** Two titles in the order a person would look for them. */
export function compareTitles(a: string, b: string): number {
  return nameCollator.compare(a, b);
}

/** Two rows, the one written on last first. */
export function compareLastWritten(a: SyncedRow, b: SyncedRow): number {
  // Compared as instants: the device and the server spell the same one
  // differently.
  return Date.parse(b.updated_at) - Date.parse(a.updated_at);
}

/** Two rows marked done, the one marked last first: by the day each was
 *  marked, and on the same day by the one written on last, since a mark is a
 *  write. */
export function compareLastDone(
  a: SyncedRow & { last_done_on: string | null },
  b: SyncedRow & { last_done_on: string | null },
): number {
  return (b.last_done_on ?? '').localeCompare(a.last_done_on ?? '') || compareLastWritten(a, b);
}

/**
 * The items filed under each name, every name once, in the order a person
 * would look for it; inside a group the items keep the order they were given.
 */
export function groupByName<T>(
  items: T[],
  nameOf: (item: T) => string,
): { name: string; items: T[] }[] {
  const byName = new Map<string, T[]>();
  for (const item of items) {
    const name = nameOf(item);
    const group = byName.get(name);
    if (group) group.push(item);
    else byName.set(name, [item]);
  }
  return [...byName]
    .map(([name, items]) => ({ name, items }))
    .sort((a, b) => nameCollator.compare(a.name, b.name));
}
