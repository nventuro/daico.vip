import { useMemo } from 'react';
import { relativeDay, todayIso } from '../../utils/dateUtils';
import { useDates } from './useDates';
import { displayDate, splitByToday } from './recurrence';

/** Tile subline: when the soonest date is, or null with nothing ahead. */
export function useDatesStatus(): string | null {
  const { items } = useDates();
  const today = todayIso();
  return useMemo(() => {
    const [first] = splitByToday(items, today).upcoming;
    return first ? `Próxima: ${relativeDay(today, displayDate(first, today))}` : null;
  }, [items, today]);
}
