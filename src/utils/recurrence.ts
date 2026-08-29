import { MONTHS_PER_YEAR, addDays, addMonths, daysUntil } from './dateUtils';

/** Days in a week, for week-scale steps. */
const DAYS_PER_WEEK = 7;

/**
 * How a repetition is counted. Every repeating thing in the app — a chore that
 * comes back, a date that comes round — is "every N of these", so both tables
 * carry the same pair of columns and share the arithmetic below.
 */
export const REPEAT_UNITS = ['day', 'week', 'month', 'year'] as const;
export type RepeatUnit = (typeof REPEAT_UNITS)[number];

/** A unit as it is said, and how the field that counts them is captioned. */
const UNITS: Record<RepeatUnit, { one: string; many: string; howMany: string }> = {
  day: { one: 'día', many: 'días', howMany: 'Cada cuántos días' },
  week: { one: 'semana', many: 'semanas', howMany: 'Cada cuántas semanas' },
  month: { one: 'mes', many: 'meses', howMany: 'Cada cuántos meses' },
  year: { one: 'año', many: 'años', howMany: 'Cada cuántos años' },
};

/**
 * The longest a unit can last, in days. Only ever used to under-estimate how
 * many steps fit in a span, so the search below walks forward and never past
 * the occurrence it is looking for.
 */
const LONGEST_DAYS: Record<RepeatUnit, number> = { day: 1, week: 7, month: 31, year: 366 };

/** How a repetition reads: «Cada mes», «Cada 3 meses». */
export function repeatLabel(every: number, unit: RepeatUnit): string {
  const { one, many } = UNITS[unit];
  return every === 1 ? `Cada ${one}` : `Cada ${every} ${many}`;
}

/** The caption of the field that says how many units go by: «Cada cuántos meses». */
export function repeatIntervalLabel(unit: RepeatUnit): string {
  return UNITS[unit].howMany;
}

/** A unit in the plural, to stand beside a number that is written elsewhere. */
export function repeatUnitsLabel(unit: RepeatUnit): string {
  return UNITS[unit].many;
}

/**
 * The date `count` units after `date` (both yyyy-mm-dd). A month- or year-scale
 * step lands on the same day of the month, clamped to the last day of a shorter
 * one (31/01 + 1 month → 28/02).
 */
export function addRepeats(date: string, count: number, unit: RepeatUnit): string {
  switch (unit) {
    case 'day':
      return addDays(date, count);
    case 'week':
      return addDays(date, count * DAYS_PER_WEEK);
    case 'month':
      return addMonths(date, count);
    case 'year':
      return addMonths(date, count * MONTHS_PER_YEAR);
  }
}

/**
 * The first occurrence on or after `from` of something anchored at `anchor`
 * that comes back every `every` units. Every occurrence is derived from the
 * anchor (anchor + k × step) rather than by stepping from the previous one, so
 * a day clamped by a short month (29/02, 31/01) never drifts. Null when there
 * is no usable interval.
 */
export function nextOccurrenceOnOrAfter(
  anchor: string,
  every: number | null,
  unit: RepeatUnit | null,
  from: string,
): string | null {
  if (every == null || every <= 0 || unit == null) return null;
  if (anchor >= from) return anchor;
  // Jump to just short of `from`, then walk: the estimate uses the longest a
  // step can last, so it can only fall short of the answer, never past it.
  let k = Math.max(0, Math.floor(daysUntil(anchor, from) / (LONGEST_DAYS[unit] * every)));
  let next = addRepeats(anchor, k * every, unit);
  while (next < from) {
    k += 1;
    next = addRepeats(anchor, k * every, unit);
  }
  return next;
}
