import { useCallback } from 'react';
import { PANTRY_SPEC, type PantryItem } from '../../lib/offline/specs';
import { useOfflineTable } from '../../hooks/useOfflineTable';
import { todayIso } from '../../utils/dateUtils';
import { lowercaseTrimmed } from '../../utils/textUtils';
import { PANTRY_PLACE_DEFAULT, expiryPatch, monthOnlyPatch } from './pantry';

/** What the user writes about an item on its page, apart from its expiry and
 *  its mark, which have hook actions of their own. */
export type PantryItemInput = Pick<PantryItem, 'title' | 'place' | 'comments'>;

/** Local-first pantry items: add / edit / mark / delete, syncing in the
 *  background. Every action is instant and works offline. */
export function usePantry() {
  const { items, loading, error, insert, update, remove } = useOfflineTable(PANTRY_SPEC);

  /** Creates an item from its title alone — undated, in the default place —
   *  resolving the new id so the caller can open it; undefined for a blank
   *  title or a failed write. */
  const add = useCallback(
    (text: string): Promise<string | undefined> => {
      const title = lowercaseTrimmed(text);
      if (!title) return Promise.resolve(undefined);
      return insert({
        title,
        expires_on: null,
        expires_month_only: false,
        place: PANTRY_PLACE_DEFAULT,
        comments: null,
        used_on: null,
      });
    },
    [insert],
  );

  const save = useCallback(
    (id: string, patch: Partial<PantryItemInput>) => update(id, patch),
    [update],
  );

  /** Sets the day an item expires, kept as its package gives it. */
  const setExpiry = useCallback(
    (item: PantryItem, expiresOn: string | null) => update(item.id, expiryPatch(item, expiresOn)),
    [update],
  );

  /** Says whether the package gave only the month. */
  const setMonthOnly = useCallback(
    (item: PantryItem, monthOnly: boolean) => update(item.id, monthOnlyPatch(item, monthOnly)),
    [update],
  );

  /** Marks an item used up today. */
  const mark = useCallback((id: string) => update(id, { used_on: todayIso() }), [update]);

  /** Puts an item back in the house. */
  const unmark = useCallback((id: string) => update(id, { used_on: null }), [update]);

  return { items, loading, error, add, save, setExpiry, setMonthOnly, mark, unmark, remove };
}
