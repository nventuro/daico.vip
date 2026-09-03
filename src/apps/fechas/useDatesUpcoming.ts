import { useMemo } from 'react';
import { entryPath, upcomingFrom, type Upcoming } from '../types';
import { todayIso } from '../../utils/dateUtils';
import { useDates } from './useDates';
import { displayDate, isNear } from './recurrence';
import { dateMarks } from './marks';

/** How many days ahead a date shows on the home screen: the week before, the
 *  same for every date — a birthday and a renewal alike. */
const DATE_NOTICE_DAYS = 7;

/** The dates due within the week, for the home screen. */
export function useDatesUpcoming(): Upcoming[] | undefined {
  const { items, loading } = useDates();
  const today = todayIso();
  return useMemo(
    () =>
      upcomingFrom({ items, loading }, (entry) => {
        const on = displayDate(entry, today);
        return isNear(on, DATE_NOTICE_DAYS, today)
          ? {
              title: entry.title,
              on,
              to: entryPath('fechas', entry.id),
              appId: 'fechas',
              marks: dateMarks(entry),
            }
          : null;
      }),
    [items, loading, today],
  );
}
