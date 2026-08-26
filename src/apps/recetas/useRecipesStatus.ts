import { countLabel } from '../../utils/textUtils';
import { useRecipes } from './useRecipes';

/** Tile subline: how many recipes there are, or null when none. */
export function useRecipesStatus(): string | null {
  const { items } = useRecipes();
  return items.length > 0 ? countLabel(items.length, 'receta', 'recetas') : null;
}
