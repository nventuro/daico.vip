import { PANTRY_SPEC } from '../../lib/offline/specs';
import { searchTable } from '../../lib/search';
import { todayIso } from '../../utils/dateUtils';
import { entryPath, type SearchHit } from '../types';
import { itemSubtitle } from './pantry';

/** Items whose title or comments mention `query`, each with when it expires —
 *  or when it was used, after the rest — and where it is kept, then
 *  attachments named so, under the item they belong to. */
export async function searchPantry(query: string): Promise<SearchHit[]> {
  const today = todayIso();
  return searchTable(PANTRY_SPEC, query, {
    fields: ['title', 'comments'],
    attachments: 'pantry_item',
    hit: (item) => ({
      title: item.title,
      subtitle: itemSubtitle(item, today),
      to: entryPath('despensa', item.id),
    }),
  });
}
