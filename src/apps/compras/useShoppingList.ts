import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { SHOPPING_SPEC, type ShoppingItem } from '../../lib/offline/specs';
import * as engine from '../../lib/offline/engine';
import { keyForAppend, keyForSlot } from './ordering';
import { struckExpired } from './struck';
import { useOfflineTable } from '../../hooks/useOfflineTable';
import { lowercaseTrimmed } from '../../utils/textUtils';

/** Max length accepted for a shopping item name (input guard). */
const SHOPPING_ITEM_NAME_MAX = 120;

/** Local-first shopping list: add / strike / reorder items and clear the struck
 *  ones, which otherwise leave on their own once their time is up, syncing in
 *  the background. Every action is instant and works offline. */
export function useShoppingList() {
  const { items, loading, error, mutate, update } = useOfflineTable(SHOPPING_SPEC);

  // The list is read as of the moment it was opened: a struck item whose time
  // was up by then is never drawn, and one whose time runs out while the list
  // is on screen stays until the next opening, so nothing is ever seen leaving.
  const [openedAt] = useState(() => Date.now());
  const kept = useMemo(
    () => items.filter((item) => !struckExpired(item, openedAt)),
    [items, openedAt],
  );

  // What is not drawn is deleted, once per row, whenever it turns up — read
  // from the store or brought down by a sync while the list is on screen.
  const queued = useRef(new Set<string>());
  useEffect(() => {
    const expired = items.filter(
      (item) => struckExpired(item, openedAt) && !queued.current.has(item.id),
    );
    if (expired.length === 0) return;
    for (const item of expired) queued.current.add(item.id);
    void mutate(async () => {
      for (const item of expired) await engine.remove(SHOPPING_SPEC, item.id);
    });
  }, [items, openedAt, mutate]);

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

  /** Persist a new fractional-index key for a dragged item. */
  const move = useCallback((id: string, position: string) => update(id, { position }), [update]);

  return { items: kept, loading, error, add, toggle, removeChecked, restore, move };
}
