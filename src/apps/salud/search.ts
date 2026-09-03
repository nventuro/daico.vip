import { CHECKUPS_SPEC, HEALTH_RECORDS_SPEC } from '../../lib/offline/specs';
import { searchTable } from '../../lib/search';
import { formatDateShort, relativeDay, todayIso } from '../../utils/dateUtils';
import { entryPath, type SearchHit } from '../types';

/** Checkups whose title or comments mention `query`, with their date when
 *  set; then studies whose title does, each with the day it was done, and the
 *  attachments named so under the study they belong to. Only the signed-in
 *  member's: nothing else is on the device. */
export async function searchSalud(query: string): Promise<SearchHit[]> {
  const today = todayIso();
  const [checkups, records] = await Promise.all([
    searchTable(CHECKUPS_SPEC, query, {
      fields: ['title', 'comments'],
      hit: (checkup) => ({
        title: checkup.title,
        subtitle: checkup.due_on ? relativeDay(today, checkup.due_on) : undefined,
        to: entryPath('salud', checkup.id),
      }),
    }),
    searchTable(HEALTH_RECORDS_SPEC, query, {
      fields: ['title'],
      attachments: 'health_record',
      hit: (record) => ({
        title: record.title,
        subtitle: formatDateShort(record.on_date),
        to: entryPath('salud', record.id),
      }),
    }),
  ]);
  return [...checkups, ...records];
}
