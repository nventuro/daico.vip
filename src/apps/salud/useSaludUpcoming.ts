import { useMemo } from 'react';
import { withinNotice } from '../../utils/dateUtils';
import { ownersWithAttachments, useAttachments } from '../../hooks/useAttachments';
import { useMembers } from '../../hooks/useMembers';
import { entryPath, upcomingFrom, type Upcoming } from '../types';
import { petNames } from './household';
import { useCheckups } from './useCheckups';
import { checkupMarks } from './marks';
import { isDone } from './recurrence';
import { useToday } from '../../hooks/useToday';

/** How many days ahead a checkup shows on the home screen: the week before,
 *  time enough to book it, the same for every checkup. A study never shows —
 *  it is nothing to be done. */
const CHECKUP_NOTICE_DAYS = 7;

/** The signed-in member's and the pets' checkups due within the week, or
 *  overdue, for the home screen. A pet's says whose it is after its title;
 *  a member's own says nothing. */
export function useSaludUpcoming(): Upcoming[] | undefined {
  const { items, loading } = useCheckups();
  const { items: attachments } = useAttachments();
  const members = useMembers();
  const today = useToday();
  return useMemo(() => {
    const attached = ownersWithAttachments(attachments, 'checkup');
    const pets = petNames(members.items);
    return upcomingFrom({ items, loading }, (checkup) => {
      if (
        isDone(checkup) ||
        checkup.due_on == null ||
        !withinNotice(today, checkup.due_on, CHECKUP_NOTICE_DAYS)
      ) {
        return null;
      }
      const petName = pets.get(checkup.member_id);
      return {
        title: petName === undefined ? checkup.title : `${checkup.title} · ${petName}`,
        on: checkup.due_on,
        to: entryPath('salud', checkup.id),
        appId: 'salud',
        marks: checkupMarks(checkup, attached.has(checkup.id)),
      };
    });
  }, [items, loading, attachments, members.items, today]);
}
