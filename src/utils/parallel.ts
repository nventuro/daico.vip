/**
 * Work through `items` with at most `atOnce` in hand, taken in the order
 * given. What waits in the work is the far end — a request on its way to a
 * server an ocean away — so what costs a run its time is the round trips one
 * after another, not the work itself; several on their way at once turn that
 * wait into one.
 *
 * The first failure stops any further item from being taken; the ones already
 * in hand are seen through, and then it is thrown. Everything else `work` has
 * to settle itself.
 */
export async function inParallel<T>(
  items: readonly T[],
  atOnce: number,
  work: (item: T) => Promise<void>,
): Promise<void> {
  let next = 0;
  const failures: unknown[] = [];
  const hand = async (): Promise<void> => {
    while (failures.length === 0) {
      const index = next++;
      if (index >= items.length) return;
      try {
        await work(items[index]);
      } catch (reason) {
        failures.push(reason);
      }
    }
  };
  await Promise.all(Array.from({ length: Math.min(atOnce, items.length) }, hand));
  if (failures.length > 0) throw failures[0];
}
