import { useCallback } from 'react';
import { SHOPPING_ITEM_NAME_MAX, type ShoppingItem } from '../types';
import { SHOPPING_SPEC } from '../lib/offline/specs';
import * as engine from '../lib/offline/engine';
import { useOfflineTable } from './useOfflineTable';

/** Local-first shopping list: add / toggle / delete items, syncing in the
 *  background. Every action is instant and works offline. */
export function useShoppingList() {
  const { items, loading, error, mutate } = useOfflineTable<ShoppingItem>(SHOPPING_SPEC);

  const add = useCallback(
    (name: string) => {
      const value = name.trim().slice(0, SHOPPING_ITEM_NAME_MAX);
      if (!value) return Promise.resolve();
      return mutate(() => engine.insert(SHOPPING_SPEC, { name: value, checked: false }));
    },
    [mutate],
  );

  const toggle = useCallback(
    (item: ShoppingItem) =>
      mutate(() => engine.update(SHOPPING_SPEC, item.id, { checked: !item.checked })),
    [mutate],
  );

  const remove = useCallback(
    (item: ShoppingItem) => mutate(() => engine.remove(SHOPPING_SPEC, item.id)),
    [mutate],
  );

  return { items, loading, error, add, toggle, remove };
}
