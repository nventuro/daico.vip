import { SHOPPING_SPEC } from '../../lib/offline/specs';
import { searchTable } from '../../lib/search';
import { appPath, type SearchHit } from '../types';

/** Shopping items whose name mentions `query`. */
export async function searchShopping(query: string): Promise<SearchHit[]> {
  return searchTable(SHOPPING_SPEC, query, {
    fields: ['name'],
    // The list has no page per item: every hit opens the list itself.
    hit: (item) => ({ title: item.name, to: appPath('compras') }),
  });
}
