import { MONTHS_PER_YEAR, MS_PER_DAY, RELATIVE_DAY_LIMIT } from '../types';

const capitalize = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

const pad2 = (n: number) => String(n).padStart(2, '0');

/** The numeric year, month (1-12) and day of a yyyy-mm-dd string. */
function parseIso(dateStr: string): [number, number, number] {
  const [year, month, day] = dateStr.split('-').map(Number);
  return [year, month, day];
}

/** A yyyy-mm-dd string from a numeric year, month (1-12) and day. */
function toIso(year: number, month: number, day: number): string {
  return `${year}-${pad2(month)}-${pad2(day)}`;
}

/** Formats an ISO date string (yyyy-mm-dd) as a long es-AR locale date, e.g. "Sábado, 14 de Febrero de 2026". */
export function formatDate(dateStr: string): string {
  const [year, month, day] = dateStr.split('-').map(Number);
  const date = new Date(year, month - 1, day);

  const weekday = date.toLocaleDateString('es-AR', { weekday: 'long' });
  const monthName = date.toLocaleDateString('es-AR', { month: 'long' });

  return `${capitalize(weekday)}, ${day} de ${capitalize(monthName)} de ${year}`;
}

/** Formats an ISO date string (yyyy-mm-dd) as dd/mm/yyyy. */
export function formatDateShort(dateStr: string): string {
  const [year, month, day] = dateStr.split('-');
  return `${day}/${month}/${year}`;
}

/** Formats an ISO date string (yyyy-mm-dd) as dd/mm. */
export function formatDayMonth(dateStr: string): string {
  const [, month, day] = dateStr.split('-');
  return `${day}/${month}`;
}

/** Today's date as yyyy-mm-dd in the device's local time zone. */
export function todayIso(): string {
  const now = new Date();
  return toIso(now.getFullYear(), now.getMonth() + 1, now.getDate());
}

/**
 * Whole calendar days from `today` to `date` (both yyyy-mm-dd): 0 for the same
 * day, negative when `date` is already past. Counted on the calendar, so a DST
 * switch never turns a day into 23 or 25 hours.
 */
export function daysUntil(today: string, date: string): number {
  const [y1, m1, d1] = parseIso(today);
  const [y2, m2, d2] = parseIso(date);
  return (Date.UTC(y2, m2 - 1, d2) - Date.UTC(y1, m1 - 1, d1)) / MS_PER_DAY;
}

/**
 * The yyyy-mm-dd date `months` calendar months after `date`. When the target
 * month is shorter, the day is clamped to its last day (31/01 + 1 → 28/02, or
 * 29/02 in a leap year).
 */
export function addMonths(date: string, months: number): string {
  const [year, month, day] = parseIso(date);
  const total = year * MONTHS_PER_YEAR + (month - 1) + months;
  const targetYear = Math.floor(total / MONTHS_PER_YEAR);
  const targetMonth = total - targetYear * MONTHS_PER_YEAR + 1;
  const lastDay = new Date(targetYear, targetMonth, 0).getDate();
  return toIso(targetYear, targetMonth, Math.min(day, lastDay));
}

/**
 * A short label for `date` relative to `today` (both yyyy-mm-dd): "hoy",
 * "mañana", "ayer", then "en N días" / "hace N días" up to RELATIVE_DAY_LIMIT
 * days away; further out, the weekday plus dd/mm (e.g. "sáb 28/03").
 */
export function relativeDay(today: string, date: string): string {
  const days = daysUntil(today, date);
  if (days === 0) return 'hoy';
  if (days === 1) return 'mañana';
  if (days === -1) return 'ayer';
  if (Math.abs(days) <= RELATIVE_DAY_LIMIT) {
    return days > 0 ? `en ${days} días` : `hace ${-days} días`;
  }
  const [year, month, day] = parseIso(date);
  const weekday = new Date(year, month - 1, day)
    .toLocaleDateString('es-AR', { weekday: 'short' })
    .toLowerCase()
    .replace(/\.$/, '');
  return `${weekday} ${formatDayMonth(date)}`;
}

/**
 * The month of a yyyy-mm string as a heading: "Marzo" when it falls in
 * `currentYear`, "Marzo 2027" otherwise.
 */
export function monthLabel(yearMonth: string, currentYear: number): string {
  const [year, month] = yearMonth.split('-').map(Number);
  const name = new Date(year, month - 1, 1).toLocaleDateString('es-AR', { month: 'long' });
  return year === currentYear ? capitalize(name) : `${capitalize(name)} ${year}`;
}
