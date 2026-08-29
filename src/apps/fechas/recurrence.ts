import {
  MONTHS_PER_YEAR,
  addMonths,
  daysUntil,
  isPast,
  monthLabel,
  yearMonthOf,
} from '../../utils/dateUtils';
import type { DateEntry, RepeatKind } from '../../lib/offline/specs';
import { groupRuns } from '../../utils/listUtils';

/** Whole months from the month of `from` to the month of `to` (days ignored). */
function monthsApart(from: string, to: string): number {
  const [fromYear, fromMonth] = from.split('-').map(Number);
  const [toYear, toMonth] = to.split('-').map(Number);
  return (toYear - fromYear) * MONTHS_PER_YEAR + (toMonth - fromMonth);
}

function byTitle(a: DateEntry, b: DateEntry): number {
  return a.title.localeCompare(b.title, 'es', { sensitivity: 'base' });
}

/**
 * The first occurrence of a date on or after `today`, given its anchor (the
 * date entered) and how it repeats. A one-off is its anchor, past or not.
 * Every occurrence is derived directly from the anchor (anchor + k × step)
 * rather than by stepping from the previous one, so a day clamped by a short
 * month (29/02, 31/01) never drifts. Null when a 'months' repeat has no usable
 * interval.
 */
export function nextOccurrenceOnOrAfter(
  anchor: string,
  repeat: RepeatKind,
  repeatMonths: number | null,
  today: string,
): string | null {
  if (repeat === 'none') return anchor;
  const step = repeat === 'yearly' ? MONTHS_PER_YEAR : repeatMonths;
  if (step == null || step <= 0) return null;
  if (anchor >= today) return anchor;
  // Land in (or just before) today's month, then step forward at most twice:
  // once if that month is earlier, once more if the clamped day is already past.
  let k = Math.max(0, Math.floor(monthsApart(anchor, today) / step));
  let next = addMonths(anchor, k * step);
  while (next < today) {
    k += 1;
    next = addMonths(anchor, k * step);
  }
  return next;
}

/** The date an entry is shown under: its next occurrence, or the anchor itself. */
export function displayDate(entry: DateEntry, today: string): string {
  return (
    nextOccurrenceOnOrAfter(entry.occurs_on, entry.repeat, entry.repeat_months, today) ??
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
