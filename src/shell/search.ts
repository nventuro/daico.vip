import { apps } from '../apps/registry';
import type { AppModule, SearchHit } from '../apps/types';

/** Most results a single app contributes to a search. */
const SEARCH_MAX_HITS_PER_APP = 20;

/** One app's results for a search. */
export interface SearchGroup {
  module: AppModule;
  hits: SearchHit[];
}

/**
 * Every app's results for `query`, grouped by app in registry order; apps
 * with nothing to show are left out. A blank query finds nothing. Each app
 * searches its own local store, so this works with no connection.
 */
export async function searchAll(query: string): Promise<SearchGroup[]> {
  const q = query.trim();
  if (!q) return [];
  const groups = await Promise.all(
    apps.map(async (module) => ({
      module,
      // Capped here, so a long-winded app never crowds the others out and
      // every app's list is cut the same way.
      hits: module.search ? (await module.search(q)).slice(0, SEARCH_MAX_HITS_PER_APP) : [],
    })),
  );
  return groups.filter((group) => group.hits.length > 0);
}
