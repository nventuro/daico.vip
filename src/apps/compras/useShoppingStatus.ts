import type { ShoppingItem } from '../../types';
import { SHOPPING_SPEC } from '../../lib/offline/specs';
import { useOfflineTable } from '../../hooks/useOfflineTable';

/** Tile subline: how many items are still to buy, or null when none. */
export function useShoppingStatus(): string | null {
  const { items } = useOfflineTable<ShoppingItem>(SHOPPING_SPEC);
  const pending = items.filter((item) => !item.checked).length;
  return pending > 0 ? `${pending} por comprar` : null;
}
