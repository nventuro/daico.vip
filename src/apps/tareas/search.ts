import { SEARCH_MAX_HITS_PER_APP, type Chore } from '../../types';
import * as engine from '../../lib/offline/engine';
import { CHORES_SPEC } from '../../lib/offline/specs';
import { matches } from '../../lib/search';
import { relativeDay, todayIso } from '../../utils/dateUtils';
import type { SearchHit } from '../types';

/** Chores whose title or notes mention `query`, with their due date when set. */
export async function searchChores(query: string): Promise<SearchHit[]> {
  const chores = await engine.listVisible<Chore>(CHORES_SPEC);
  const today = todayIso();
  return chores
    .filter((chore) => matches(chore.title, query) || matches(chore.notes, query))
    .slice(0, SEARCH_MAX_HITS_PER_APP)
    .map((chore) => ({
      title: chore.title,
      subtitle: chore.due_on ? relativeDay(today, chore.due_on) : undefined,
      to: '/tareas',
    }));
}
