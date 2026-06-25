import { useCallback } from 'react';
import { SHOPPING_ITEM_NAME_MAX, type ShoppingItem } from '../types';
import { SHOPPING_SPEC } from '../lib/offline/specs';
import * as engine from '../lib/offline/engine';
import { keyForAppend } from '../lib/ordering';
import { useOfflineTable } from './useOfflineTable';

/** Local-first shopping list: add / toggle / delete / reorder items, syncing in
 *  the background. Every action is instant and works offline. */
export function useShoppingList() {
  const { items, loading, error, mutate } = useOfflineTable<ShoppingItem>(SHOPPING_SPEC);

  const add = useCallback(
    (name: string) => {
      const value = name.trim().slice(0, SHOPPING_ITEM_NAME_MAX);
      if (!value) return Promise.resolve();
      // Append after the last active item (items are kept in position order).
      const position = keyForAppend(items.filter((i) => !i.checked));
      return mutate(() => engine.insert(SHOPPING_SPEC, { name: value, checked: false, position }));
    },
    [items, mutate],
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

  /** Persist a new fractional-index key for a dragged item (see ordering.ts). */
  const move = useCallback(
    (id: string, position: string) =>
      mutate(() => engine.update(SHOPPING_SPEC, id, { position })),
    [mutate],
  );

  return { items, loading, error, add, toggle, remove, move };
}
