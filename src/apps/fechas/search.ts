import { DATES_SPEC } from '../../lib/offline/specs';
import { searchTable } from '../../lib/search';
import { relativeDay, todayIso } from '../../utils/dateUtils';
import { entryPath, type SearchHit } from '../types';
import { displayDate } from './recurrence';

/** Dates whose title or notes mention `query`, each with when it next falls. */
export async function searchDates(query: string): Promise<SearchHit[]> {
  const today = todayIso();
  return searchTable(DATES_SPEC, query, {
    fields: ['title', 'notes'],
    hit: (entry) => ({
      title: entry.title,
      subtitle: relativeDay(today, displayDate(entry, today)),
      to: entryPath('fechas', entry.id),
    }),
  });
}
