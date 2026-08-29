import { daysUntil, isPast, monthLabel, yearMonthOf } from '../../utils/dateUtils';
import { nextOccurrenceOnOrAfter } from '../../utils/recurrence';
import type { DateEntry } from '../../lib/offline/specs';
import { groupRuns } from '../../utils/listUtils';

function byTitle(a: DateEntry, b: DateEntry): number {
  return a.title.localeCompare(b.title, 'es', { sensitivity: 'base' });
}

/** The date an entry is shown under: its next occurrence, or the anchor itself. */
export function displayDate(entry: DateEntry, today: string): string {
  return (
    nextOccurrenceOnOrAfter(entry.occurs_on, entry.repeat_every, entry.repeat_unit, today) ??
    entry.occurs_on
  );
}

/** Whether `date` is today or within the next `noticeDays` days. */
export function isNear(date: string, noticeDays: number, today: string): boolean {
  const days = daysUntil(today, date);
  return days >= 0 && days <= noticeDays;
}

/**
 * Entries split around today. `upcoming` holds every entry whose display date
 * is today or later (a repeating entry always is, since it rolls forward),
 * soonest first; `past` holds one-offs whose date has gone by, most recent
 * first.
 */
export function splitByToday(
  entries: DateEntry[],
  today: string,
): { upcoming: DateEntry[]; past: DateEntry[] } {
  const shown = new Map(entries.map((entry) => [entry.id, displayDate(entry, today)]));
  const dateOf = (entry: DateEntry) => shown.get(entry.id) ?? entry.occurs_on;
  const upcoming = entries
    .filter((entry) => !isPast(dateOf(entry), today))
    .sort((a, b) => dateOf(a).localeCompare(dateOf(b)) || byTitle(a, b));
  const past = entries
    .filter((entry) => isPast(dateOf(entry), today))
    .sort((a, b) => dateOf(b).localeCompare(dateOf(a)) || byTitle(a, b));
  return { upcoming, past };
}

export interface MonthGroup {
  /** yyyy-mm */
  key: string;
  label: string;
  entries: DateEntry[];
}

/**
 * Consecutive runs of entries sharing the month of their display date, each
 * with a heading ("Marzo", or "Marzo 2027" outside the current year). Expects
 * entries already in date order.
 */
export function groupByMonth(entries: DateEntry[], today: string): MonthGroup[] {
  const currentYear = Number(today.slice(0, 4));
  return groupRuns(entries, (entry) => yearMonthOf(displayDate(entry, today))).map(
    ({ key, items }) => ({ key, label: monthLabel(key, currentYear), entries: items }),
  );
}
