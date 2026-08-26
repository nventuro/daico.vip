import { useShoppingList } from './useShoppingList';

/** Tile subline: how many items are still to buy, or null when none. */
export function useShoppingStatus(): string | null {
  const { items } = useShoppingList();
  const pending = items.filter((item) => !item.checked).length;
  return pending > 0 ? `${pending} por comprar` : null;
}
