import { RECIPES_SPEC } from '../../lib/offline/specs';
import { SEARCH_EXCERPT_RADIUS, excerpt, searchTable } from '../../lib/search';
import { entryPath, type SearchHit } from '../types';

/** Recipes that mention `query` in their title, or in their body (shown with the matching passage). */
export async function searchRecipes(query: string): Promise<SearchHit[]> {
  return searchTable(RECIPES_SPEC, query, {
    fields: ['title', 'body'],
    hit: (recipe, matched) => ({
      title: recipe.title,
      subtitle: matched === 'body' ? excerpt(recipe.body, query, SEARCH_EXCERPT_RADIUS) : undefined,
      to: entryPath('recetas', recipe.id),
    }),
  });
}
