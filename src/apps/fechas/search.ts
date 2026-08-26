import { SEARCH_MAX_HITS_PER_APP, type DateEntry } from '../../types';
import * as engine from '../../lib/offline/engine';
import { DATES_SPEC } from '../../lib/offline/specs';
import { matches } from '../../lib/search';
import { relativeDay, todayIso } from '../../utils/dateUtils';
import type { SearchHit } from '../types';
import { displayDate } from './recurrence';

/** Dates whose title or notes mention `query`, each with when it next falls. */
export async function searchDates(query: string): Promise<SearchHit[]> {
  const entries = await engine.listVisible<DateEntry>(DATES_SPEC);
  const today = todayIso();
  return entries
    .filter((entry) => matches(entry.title, query) || matches(entry.notes, query))
    .slice(0, SEARCH_MAX_HITS_PER_APP)
    .map((entry) => ({
      title: entry.title,
      subtitle: relativeDay(today, displayDate(entry, today)),
      to: `/fechas/${entry.id}`,
    }));
}
