import { SEARCH_MAX_HITS_PER_APP, type Chore } from '../../types';
import * as engine from '../../lib/offline/engine';
import { CHORES_SPEC } from '../../lib/offline/specs';
import { matches } from '../../lib/search';
import { searchAttachments } from '../../lib/searchAttachments';
import { relativeDay, todayIso } from '../../utils/dateUtils';
import type { SearchHit } from '../types';

/** Chores whose title or notes mention `query`, with their due date when set,
 *  then attachments named so, under the chore they belong to. */
export async function searchChores(query: string): Promise<SearchHit[]> {
  const chores = await engine.listVisible<Chore>(CHORES_SPEC);
  const today = todayIso();
  const choreHits = chores
    .filter((chore) => matches(chore.title, query) || matches(chore.notes, query))
    .map((chore) => ({
      title: chore.title,
      subtitle: chore.due_on ? relativeDay(today, chore.due_on) : undefined,
      to: `/tareas/${chore.id}`,
    }));
  const owners = new Map(
    chores.map((chore) => [chore.id, { title: chore.title, to: `/tareas/${chore.id}` }]),
  );
  const attachmentHits = await searchAttachments('chore', owners, query);
  return [...choreHits, ...attachmentHits].slice(0, SEARCH_MAX_HITS_PER_APP);
}
