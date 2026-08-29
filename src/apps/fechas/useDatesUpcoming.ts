import { useMemo } from 'react';
import { entryPath, upcomingFrom, type Upcoming } from '../types';
import { todayIso } from '../../utils/dateUtils';
import { useDates } from './useDates';
import { displayDate, isNear } from './recurrence';
import { dateMarks } from './marks';

/** The dates inside their notice window, for the home screen. */
export function useDatesUpcoming(): Upcoming[] | undefined {
  const { items, loading } = useDates();
  const today = todayIso();
  return useMemo(
    () =>
      upcomingFrom({ items, loading }, (entry) => {
        const on = displayDate(entry, today);
        return isNear(on, entry.notice_days, today)
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
