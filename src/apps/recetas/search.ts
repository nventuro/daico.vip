import { SEARCH_EXCERPT_RADIUS, SEARCH_MAX_HITS_PER_APP, type Recipe } from '../../types';
import * as engine from '../../lib/offline/engine';
import { RECIPES_SPEC } from '../../lib/offline/specs';
import { excerpt, matches } from '../../lib/search';
import type { SearchHit } from '../types';

/** Recipes that mention `query` in their title, or in their body (shown with the matching passage). */
export async function searchRecipes(query: string): Promise<SearchHit[]> {
  const recipes = await engine.listVisible<Recipe>(RECIPES_SPEC);
  return recipes
    .flatMap((recipe): SearchHit[] => {
      const to = `/recetas/${recipe.id}`;
      if (matches(recipe.title, query)) return [{ title: recipe.title, to }];
      if (matches(recipe.body, query)) {
        return [
          { title: recipe.title, subtitle: excerpt(recipe.body, query, SEARCH_EXCERPT_RADIUS), to },
        ];
      }
      return [];
    })
    .slice(0, SEARCH_MAX_HITS_PER_APP);
}
