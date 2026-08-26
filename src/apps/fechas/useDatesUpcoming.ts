import { useMemo } from 'react';
import type { Upcoming } from '../types';
import { todayIso } from '../../utils/dateUtils';
import { useDates } from './useDates';
import { displayDate, isNear } from './recurrence';

/** The dates inside their notice window, for the home screen. */
export function useDatesUpcoming(): Upcoming[] {
  const { items } = useDates();
  const today = todayIso();
  return useMemo(
    () =>
      items.flatMap((entry): Upcoming[] => {
        const on = displayDate(entry, today);
        return isNear(on, entry.notice_days, today)
          ? [{ title: entry.title, on, to: `/fechas/${entry.id}`, appId: 'fechas' }]
          : [];
      }),
    [items, today],
  );
}
