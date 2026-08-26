import type { Upcoming } from '../apps/types';

/** Soonest first; same-day entries by title. Does not modify the input. */
export function sortUpcoming(items: Upcoming[]): Upcoming[] {
  return [...items].sort(
    (a, b) => a.on.localeCompare(b.on) || a.title.localeCompare(b.title, 'es', { sensitivity: 'base' }),
  );
}

/** Whether two lists hold the same entries in the same order. */
export function sameUpcoming(a: Upcoming[], b: Upcoming[]): boolean {
  return (
    a.length === b.length &&
    a.every((item, i) => {
      const other = b[i];
      return (
        item.title === other.title &&
        item.on === other.on &&
        item.to === other.to &&
        item.appId === other.appId
      );
    })
  );
}
