import { DOCUMENTS_SPEC } from '../../lib/offline/specs';
import { searchTable } from '../../lib/search';
import { todayIso } from '../../utils/dateUtils';
import { entryPath, type SearchHit } from '../types';
import { expiryLabel } from './expiry';

/** Documents whose title mentions `query`, with their expiry when set, then
 *  attachments named so, under the document they belong to. */
export async function searchDocuments(query: string): Promise<SearchHit[]> {
  const today = todayIso();
  return searchTable(DOCUMENTS_SPEC, query, {
    fields: ['title'],
    attachments: 'document',
    hit: (entry) => ({
      title: entry.title,
      subtitle: entry.expires_on ? expiryLabel(entry.expires_on, today) : undefined,
      to: entryPath('documentos', entry.id),
    }),
  });
}
