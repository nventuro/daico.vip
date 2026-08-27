import { useCallback } from 'react';
import type { Recipe } from '../../types';
import { RECIPES_SPEC } from '../../lib/offline/specs';
import * as engine from '../../lib/offline/engine';
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
  const { items, loading, error, mutate } = useOfflineTable<Recipe>(RECIPES_SPEC);

  /** Creates a recipe with just its title, resolving the new id so the caller
   *  can open it for writing; undefined for a blank title or a failed write. */
  const add = useCallback(
    (title: string): Promise<string | undefined> => {
      const value = lowercaseTrimmed(title);
      if (!value) return Promise.resolve(undefined);
      return mutate(() =>
        engine.insert(RECIPES_SPEC, { title: value, body: '', minutes: null, servings: null }),
      );
    },
    [mutate],
  );

  const save = useCallback(
    (id: string, patch: Partial<RecipeInput>) => mutate(() => engine.update(RECIPES_SPEC, id, patch)),
    [mutate],
  );

  const remove = useCallback(
    (recipe: Recipe) => mutate(() => engine.remove(RECIPES_SPEC, recipe.id)),
    [mutate],
  );

  return { items, loading, error, add, save, remove };
}
