import { SEARCH_MAX_HITS_PER_APP, type ShoppingItem } from '../../types';
import * as engine from '../../lib/offline/engine';
import { SHOPPING_SPEC } from '../../lib/offline/specs';
import { matches } from '../../lib/search';
import type { SearchHit } from '../types';

/** Shopping items whose name mentions `query`. */
export async function searchShopping(query: string): Promise<SearchHit[]> {
  const items = await engine.listVisible<ShoppingItem>(SHOPPING_SPEC);
  return items
    .filter((item) => matches(item.name, query))
    .slice(0, SEARCH_MAX_HITS_PER_APP)
    .map((item) => ({ title: item.name, to: '/compras' }));
}
