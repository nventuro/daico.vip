import { CHECKUPS_SPEC, HEALTH_RECORDS_SPEC, MEMBERS_SPEC } from '../../lib/offline/specs';
import * as engine from '../../lib/offline/engine';
import { searchTable } from '../../lib/search';
import { formatDateShort, relativeDay, todayIso } from '../../utils/dateUtils';
import { entryPath, type SearchHit } from '../types';
import { petNames } from './household';

/** Checkups whose title or comments mention `query`, with their date when
 *  set; then studies whose title does, each with the day it was done; and
 *  under either, the attachments named so. The signed-in member's and the
 *  pets': nothing else is on the device. A pet's row is named first, before
 *  the date; a member's own says nothing of whose it is. */
export async function searchSalud(query: string): Promise<SearchHit[]> {
  const today = todayIso();
  const pets = petNames(await engine.listVisible(MEMBERS_SPEC));
  /** What lists a row after its title: whose it is, when it is a pet's, and
   *  its day; nothing when there is neither. */
  const subtitle = (memberId: string, day: string | undefined): string | undefined =>
    [pets.get(memberId), day].filter((part) => part !== undefined).join(' · ') || undefined;

  const [checkups, records] = await Promise.all([
    searchTable(CHECKUPS_SPEC, query, {
      fields: ['title', 'comments'],
      attachments: 'checkup',
      hit: (checkup) => ({
        title: checkup.title,
        subtitle: subtitle(
          checkup.member_id,
          checkup.due_on ? relativeDay(today, checkup.due_on) : undefined,
        ),
        to: entryPath('salud', checkup.id),
      }),
    }),
    searchTable(HEALTH_RECORDS_SPEC, query, {
      fields: ['title'],
      attachments: 'health_record',
      hit: (record) => ({
        title: record.title,
        subtitle: subtitle(record.member_id, formatDateShort(record.on_date)),
        to: entryPath('salud', record.id),
      }),
    }),
  ]);
  return [...checkups, ...records];
}
