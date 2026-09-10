import type { ShoppingItem } from '../../lib/offline/specs';

/** How long a struck item stays on the list before it is deleted on its own. */
export const STRUCK_KEPT_MS = 30 * 60 * 1000;

/**
 * Whether a struck item's time on the list is up at `at`, counted from the
 * row's last write: the strike itself, unless the item was moved after it.
 */
export function struckExpired(
  item: Pick<ShoppingItem, 'checked' | 'updated_at'>,
  at: number,
): boolean {
  return item.checked && Date.parse(item.updated_at) + STRUCK_KEPT_MS <= at;
}
