import { useCallback } from 'react';
import { SHOPPING_SECTIONS_SPEC } from '../../lib/offline/specs';
import * as engine from '../../lib/offline/engine';
import { keyForAppend } from './ordering';
import { useOfflineTable } from '../../hooks/useOfflineTable';
import { lowercaseTrimmed } from '../../utils/textUtils';

/** Max length accepted for a section's name (input guard). */
const SECTION_NAME_MAX = 60;

/** The shopping list's sections — where things are bought — in the order the
 *  household walks through them: add, rename, reorder and delete, offline
 *  like the list itself. */
export function useShoppingSections() {
  const { items, loading, error, mutate, update, remove } = useOfflineTable(SHOPPING_SECTIONS_SPEC);

  /** Add a section after the last; resolves to its id. */
  const add = useCallback(
    (name: string) => {
      const value = lowercaseTrimmed(name).slice(0, SECTION_NAME_MAX);
      if (!value) return Promise.resolve(undefined);
      return mutate(async () => {
        const current = await engine.listVisible(SHOPPING_SECTIONS_SPEC);
        return engine.insert(SHOPPING_SECTIONS_SPEC, {
          name: value,
          position: keyForAppend(current),
        });
      });
    },
    [mutate],
  );

  const rename = useCallback(
    (id: string, name: string) => update(id, { name: name.slice(0, SECTION_NAME_MAX) }),
    [update],
  );

  /** Persist a new fractional-index key for a dragged section. */
  const move = useCallback((id: string, position: string) => update(id, { position }), [update]);

  return { sections: items, loading, error, add, rename, move, remove };
}
