import { CHORES_SPEC } from '../../lib/offline/specs';
import { searchTable } from '../../lib/search';
import { relativeDay, todayIso } from '../../utils/dateUtils';
import { entryPath, type SearchHit } from '../types';

/** Chores whose title or comments mention `query`, with their due date when set,
 *  then attachments named so, under the chore they belong to. */
export async function searchChores(query: string): Promise<SearchHit[]> {
  const today = todayIso();
  return searchTable(CHORES_SPEC, query, {
    fields: ['title', 'comments'],
    attachments: 'chore',
    hit: (chore) => ({
      title: chore.title,
      subtitle: chore.due_on ? relativeDay(today, chore.due_on) : undefined,
      to: entryPath('tareas', chore.id),
    }),
  });
}
