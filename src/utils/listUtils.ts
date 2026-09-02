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

/** How group names are ordered: in the household's language, so an accented
 *  name sits where a person would look for it rather than after the z. */
const nameCollator = new Intl.Collator('es');

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
