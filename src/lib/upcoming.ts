import type { Upcoming } from '../apps/types';
import { RELATIVE_DAY_LIMIT } from '../types';
import { daysUntil, formatWeekdayDay, monthLabel } from '../utils/dateUtils';

/** Soonest first; same-day entries by title. Does not modify the input. */
export function sortUpcoming(items: Upcoming[]): Upcoming[] {
  return [...items].sort(
    (a, b) => a.on.localeCompare(b.on) || a.title.localeCompare(b.title, 'es', { sensitivity: 'base' }),
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
  const withMonth = date.slice(0, 7) !== today.slice(0, 7);
  const day = formatWeekdayDay(date, withMonth);
  if (days === 0) return { key: date, label: `Hoy · ${day}`, overdue: false };
  if (days === 1) return { key: date, label: `Mañana · ${day}`, overdue: false };
  if (days <= RELATIVE_DAY_LIMIT) return { key: date, label: day, overdue: false };
  const yearMonth = date.slice(0, 7);
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
  const groups: UpcomingGroup[] = [];
  for (const row of rows) {
    const heading = dayHeading(row.on, today, currentYear);
    const last = groups[groups.length - 1];
    if (last?.key === heading.key) last.rows.push(row);
    else groups.push({ ...heading, rows: [row] });
  }
  return groups;
}
