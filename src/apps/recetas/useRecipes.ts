import { useCallback } from 'react';
import { RECIPES_SPEC } from '../../lib/offline/specs';
import { useOfflineTable } from '../../hooks/useOfflineTable';
import { lowercaseTrimmed } from '../../utils/textUtils';

/** Everything the user decides about a recipe; the row's own columns minus the
 *  engine-managed ones. */
export interface RecipeInput {
  title: string;
  body: string;
  minutes: number | null;
  servings: number | null;
}

/** Local-first recipes: add / edit / delete, syncing in the background. Every
 *  action is instant and works offline. */
export function useRecipes() {
  const { items, loading, error, insert, update, remove } = useOfflineTable(RECIPES_SPEC);

  /** Creates a recipe with just its title, resolving the new id so the caller
   *  can open it for writing; undefined for a blank title or a failed write. */
  const add = useCallback(
    (title: string): Promise<string | undefined> => {
      const value = lowercaseTrimmed(title);
      if (!value) return Promise.resolve(undefined);
      return insert({ title: value, body: '', minutes: null, servings: null });
    },
    [insert],
  );

  const save = useCallback(
    (id: string, patch: Partial<RecipeInput>) => update(id, patch),
    [update],
  );

  return { items, loading, error, add, save, remove };
}
