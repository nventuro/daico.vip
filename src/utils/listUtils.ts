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
