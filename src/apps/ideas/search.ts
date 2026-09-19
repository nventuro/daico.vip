import { IDEAS_SPEC, type Idea } from '../../lib/offline/specs';
import { SEARCH_EXCERPT_RADIUS, excerpt, searchTable } from '../../lib/search';
import { entryPath, type SearchHit } from '../types';

/** What a hit says first of an idea that is not on the list. */
const ARCHIVED_LABEL = 'Archivada';

/** The line under a hit: the idea's group, or the matching passage when the
 *  body is what matched — and ahead of either, that the idea is archived,
 *  since it will not be found on the list. */
function subtitleOf(idea: Idea, matched: keyof Idea, query: string): string {
  const said =
    matched === 'body' ? excerpt(idea.body, query, SEARCH_EXCERPT_RADIUS) : idea.group_name;
  if (!idea.archived) return said;
  return said ? `${ARCHIVED_LABEL} · ${said}` : ARCHIVED_LABEL;
}

/**
 * Ideas that mention `query` in their title, their group or their body — each
 * under its group, or with the matching passage when the body is what matched,
 * the archived ones after the rest and saying so — then attachments named so,
 * under the idea they belong to.
 */
export async function searchIdeas(query: string): Promise<SearchHit[]> {
  return searchTable(IDEAS_SPEC, query, {
    fields: ['title', 'group_name', 'body'],
    attachments: 'idea',
    hit: (idea, matched) => ({
      title: idea.title,
      subtitle: subtitleOf(idea, matched, query),
      to: entryPath('ideas', idea.id),
    }),
  });
}
