import { IDEAS_SPEC } from '../../lib/offline/specs';
import { SEARCH_EXCERPT_RADIUS, excerpt, searchTable } from '../../lib/search';
import { entryPath, type SearchHit } from '../types';

/**
 * Ideas that mention `query` in their title, their group or their body — each
 * under its group, or with the matching passage when the body is what matched —
 * then attachments named so, under the idea they belong to.
 */
export async function searchIdeas(query: string): Promise<SearchHit[]> {
  return searchTable(IDEAS_SPEC, query, {
    fields: ['title', 'group_name', 'body'],
    attachments: 'idea',
    hit: (idea, matched) => ({
      title: idea.title,
      subtitle:
        matched === 'body' ? excerpt(idea.body, query, SEARCH_EXCERPT_RADIUS) : idea.group_name,
      to: entryPath('ideas', idea.id),
    }),
  });
}
