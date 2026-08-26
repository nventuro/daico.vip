import { apps } from './registry';
import type { AppModule, SearchHit } from './types';

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
    apps.map(async (module) => ({ module, hits: module.search ? await module.search(q) : [] })),
  );
  return groups.filter((group) => group.hits.length > 0);
}
