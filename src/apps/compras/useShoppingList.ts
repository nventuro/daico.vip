import { useCallback } from 'react';
import { SHOPPING_SPEC, type ShoppingItem } from '../../lib/offline/specs';
import * as engine from '../../lib/offline/engine';
import { keyForAppend, keyForSlot } from './ordering';
import { useOfflineTable } from '../../hooks/useOfflineTable';
import { lowercaseTrimmed } from '../../utils/textUtils';

/** Max length accepted for a shopping item name (input guard). */
const SHOPPING_ITEM_NAME_MAX = 120;

/** Local-first shopping list: add / strike / reorder items and clear the struck
 *  ones, syncing in the background. Every action is instant and works offline. */
export function useShoppingList() {
  const { items, loading, error, mutate, update } = useOfflineTable(SHOPPING_SPEC);

  const add = useCallback(
    (name: string) => {
      const value = lowercaseTrimmed(name).slice(0, SHOPPING_ITEM_NAME_MAX);
      if (!value) return Promise.resolve();
      return mutate(async () => {
        // Append after the last item (items are kept in position order). Read
        // the list at write time rather than closing over `items`, so several
        // adds in a row from one handler each land after the previous one
        // instead of all minting the same key.
        const current = await engine.listVisible(SHOPPING_SPEC);
        const position = keyForAppend(current);
        return engine.insert(SHOPPING_SPEC, { name: value, checked: false, position });
      });
    },
    [mutate],
  );

  const toggle = useCallback(
    (item: ShoppingItem) => update(item.id, { checked: !item.checked }),
    [update],
  );

  /** Delete every struck item; resolves to what was deleted, for `restore`. */
  const removeChecked = useCallback(
    () =>
      mutate(async () => {
        const current = await engine.listVisible(SHOPPING_SPEC);
        const struck = current.filter((i) => i.checked);
        for (const item of struck) await engine.remove(SHOPPING_SPEC, item.id);
        return struck;
      }),
    [mutate],
  );

  /** Put deleted items back, still struck and in their old places. They come
   *  back as new rows: the old ids belong to deletions already queued, and a
   *  delete wins over any later write to the same id. */
  const restore = useCallback(
    (removed: ShoppingItem[]) =>
      mutate(async () => {
        for (const item of removed) {
          const current = await engine.listVisible(SHOPPING_SPEC);
          const position = keyForSlot(current, item.position);
          await engine.insert(SHOPPING_SPEC, { name: item.name, checked: item.checked, position });
        }
      }),
    [mutate],
  );

  /** Persist a new fractional-index key for a dragged item (see ordering.ts). */
  const move = useCallback((id: string, position: string) => update(id, { position }), [update]);

  return { items, loading, error, add, toggle, removeChecked, restore, move };
}
