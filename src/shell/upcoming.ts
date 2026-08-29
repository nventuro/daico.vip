import type { Upcoming } from '../apps/types';
import {
  RELATIVE_DAY_LIMIT,
  daysUntil,
  formatWeekdayDay,
  monthLabel,
  yearMonthOf,
} from '../utils/dateUtils';
import { groupRuns } from '../utils/listUtils';

/** Soonest first; same-day entries by title. Does not modify the input. */
export function sortUpcoming(items: Upcoming[]): Upcoming[] {
  return [...items].sort(
    (a, b) =>
      a.on.localeCompare(b.on) || a.title.localeCompare(b.title, 'es', { sensitivity: 'base' }),
  );
}

function sameMarks(a: Upcoming['marks'] = [], b: Upcoming['marks'] = []): boolean {
  return a.length === b.length && a.every((mark, i) => mark === b[i]);
}

/** Whether two lists hold the same entries in the same order. */
export function sameUpcoming(a: Upcoming[], b: Upcoming[]): boolean {
  return (
    a.length === b.length &&
    a.every((item, i) => {
      const other = b[i];
      return (
        item.title === other.title &&
        item.on === other.on &&
        item.to === other.to &&
        item.appId === other.appId &&
        sameMarks(item.marks, other.marks)
      );
    })
  );
}

/**
 * `byApp` with `items` as `appId`'s entries — or `byApp` itself when the app
 * has already reported exactly these, so a re-report changes nothing. An app's
 * first report always counts, even with nothing in it: that is how it is told
 * from one still to come.
 */
export function withReport<K extends string>(
  byApp: Partial<Record<K, Upcoming[]>>,
  appId: K,
  items: Upcoming[],
): Partial<Record<K, Upcoming[]>> {
  const reported = byApp[appId];
  return reported && sameUpcoming(reported, items) ? byApp : { ...byApp, [appId]: items };
}

/** A run of upcoming entries under one day (or month) heading. */
export interface UpcomingGroup {
  key: string;
  label: string;
  /** Whether the group holds what is already past. */
  overdue: boolean;
  rows: Upcoming[];
}

function dayHeading(date: string, today: string, currentYear: number): Omit<UpcomingGroup, 'rows'> {
  const days = daysUntil(today, date);
  if (days < 0) return { key: 'past', label: 'Vencidas', overdue: true };
  const withMonth = yearMonthOf(date) !== yearMonthOf(today);
  const day = formatWeekdayDay(date, withMonth);
  if (days === 0) return { key: date, label: `Hoy · ${day}`, overdue: false };
  if (days === 1) return { key: date, label: `Mañana · ${day}`, overdue: false };
  if (days <= RELATIVE_DAY_LIMIT) return { key: date, label: day, overdue: false };
  const yearMonth = yearMonthOf(date);
  return { key: yearMonth, label: monthLabel(yearMonth, currentYear), overdue: false };
}

/**
 * Consecutive runs of entries by when they fall, each with a heading: one
 * "Vencidas" group for anything past, a group per day up to RELATIVE_DAY_LIMIT
 * days ahead ("Hoy · Jueves 27", "Mañana · Viernes 28", "Lunes 31"), then one
 * per month. Expects entries already in date order.
 */
export function groupByDay(rows: Upcoming[], today: string): UpcomingGroup[] {
  const currentYear = Number(today.slice(0, 4));
  return groupRuns(rows, (row) => dayHeading(row.on, today, currentYear).key).map(({ items }) => ({
    ...dayHeading(items[0].on, today, currentYear),
    rows: items,
  }));
}
