import { SEARCH_MAX_HITS_PER_APP, type DocumentEntry } from '../../types';
import * as engine from '../../lib/offline/engine';
import { DOCUMENTS_SPEC } from '../../lib/offline/specs';
import { matches } from '../../lib/search';
import { searchAttachments } from '../../lib/searchAttachments';
import { todayIso } from '../../utils/dateUtils';
import type { SearchHit } from '../types';
import { expiryLabel } from './expiry';

/** Documents whose title mentions `query`, with their expiry when set, then
 *  attachments named so, under the document they belong to. */
export async function searchDocuments(query: string): Promise<SearchHit[]> {
  const documents = await engine.listVisible<DocumentEntry>(DOCUMENTS_SPEC);
  const today = todayIso();
  const documentHits = documents
    .filter((entry) => matches(entry.title, query))
    .map((entry) => ({
      title: entry.title,
      subtitle: entry.expires_on ? expiryLabel(entry.expires_on, today) : undefined,
      to: `/documentos/${entry.id}`,
    }));
  const owners = new Map(
    documents.map((entry) => [entry.id, { title: entry.title, to: `/documentos/${entry.id}` }]),
  );
  const attachmentHits = await searchAttachments('document', owners, query);
  return [...documentHits, ...attachmentHits].slice(0, SEARCH_MAX_HITS_PER_APP);
}
