import { useMemo } from 'react';
import { daysUntil, todayIso } from '../../utils/dateUtils';
import { entryPath, upcomingFrom, type Upcoming } from '../types';
import { useCheckups } from './useCheckups';
import { checkupMarks } from './marks';
import { isDone } from './recurrence';

/** How many days ahead a checkup shows on the home screen: the week before,
 *  time enough to book it, the same for every checkup. A study never shows —
 *  it is nothing to be done. */
const CHECKUP_NOTICE_DAYS = 7;

/** The signed-in member's checkups due within the week, or overdue, for the
 *  home screen. */
export function useSaludUpcoming(): Upcoming[] | undefined {
  const { items, loading } = useCheckups();
  const today = todayIso();
  return useMemo(
    () =>
      upcomingFrom({ items, loading }, (checkup) =>
        !isDone(checkup) &&
        checkup.due_on != null &&
        daysUntil(today, checkup.due_on) <= CHECKUP_NOTICE_DAYS
          ? {
              title: checkup.title,
              on: checkup.due_on,
              to: entryPath('salud', checkup.id),
              appId: 'salud',
              marks: checkupMarks(checkup),
            }
          : null,
      ),
    [items, loading, today],
  );
}
