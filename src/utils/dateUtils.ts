import { capitalize, pad2 } from './textUtils';

/** Milliseconds in one day, for calendar-day arithmetic. */
const MS_PER_DAY = 86_400_000;

/** Months in a year, for calendar-month arithmetic. */
export const MONTHS_PER_YEAR = 12;

/**
 * Beyond ±this many days a relative date label switches to the spelled date.
 * Within it, days ahead are named by weekday alone, so this must stay under 7
 * or a name could mean either of two days.
 */
export const RELATIVE_DAY_LIMIT = 6;

/** The numeric year, month (1-12) and day of a yyyy-mm-dd string. */
function parseIso(dateStr: string): [number, number, number] {
  const [year, month, day] = dateStr.split('-').map(Number);
  return [year, month, day];
}

/** A yyyy-mm-dd string from a numeric year, month (1-12) and day. */
function toIso(year: number, month: number, day: number): string {
  return `${year}-${pad2(month)}-${pad2(day)}`;
}

/** Formats an ISO date string (yyyy-mm-dd) as a long es-AR locale date, e.g. "Sábado 14 de Febrero de 2026". */
export function formatDate(dateStr: string): string {
  const [year, month, day] = dateStr.split('-').map(Number);
  const date = new Date(year, month - 1, day);

  const weekday = date.toLocaleDateString('es-AR', { weekday: 'long' });
  const monthName = date.toLocaleDateString('es-AR', { month: 'long' });

  return `${capitalize(weekday)} ${day} de ${capitalize(monthName)} de ${year}`;
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

/** The month a yyyy-mm-dd date falls in, as yyyy-mm. */
export function yearMonthOf(date: string): string {
  return date.slice(0, 7);
}

/** Whether `date` (yyyy-mm-dd) has gone by on `today`. */
export function isPast(date: string, today: string): boolean {
  return date < today;
}

/** How a due date is announced: "vence" while it is ahead, "venció" once it
 *  has gone by. */
export function dueWord(date: string, today: string): string {
  return isPast(date, today) ? 'venció' : 'vence';
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

/** The yyyy-mm-dd date `days` calendar days after `date` (negative goes back). */
export function addDays(date: string, days: number): string {
  const [year, month, day] = parseIso(date);
  const target = new Date(Date.UTC(year, month - 1, day + days));
  return toIso(target.getUTCFullYear(), target.getUTCMonth() + 1, target.getUTCDate());
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

/** One es-AR date part (a weekday or month name), lower-case and without the abbreviation dot. */
function namePart(date: Date, options: Intl.DateTimeFormatOptions): string {
  return date.toLocaleDateString('es-AR', options).toLowerCase().replace(/\.$/, '');
}

/**
 * A short label for `date` relative to `today` (both yyyy-mm-dd), the way a
 * person would say it: "hoy", "mañana", "ayer"; the weekday alone ("viernes")
 * up to RELATIVE_DAY_LIMIT days ahead, which is close enough for the name to be
 * unambiguous; "hace N días" the same distance back; and beyond that the date
 * itself, "vie 18 sept" within the current year or "15 ene 2027" outside it.
 */
export function relativeDay(today: string, date: string): string {
  const days = daysUntil(today, date);
  if (days === 0) return 'hoy';
  if (days === 1) return 'mañana';
  if (days === -1) return 'ayer';
  const [year, month, day] = parseIso(date);
  const target = new Date(year, month - 1, day);
  if (days > 0 && days <= RELATIVE_DAY_LIMIT) return namePart(target, { weekday: 'long' });
  if (days < 0 && -days <= RELATIVE_DAY_LIMIT) return `hace ${-days} días`;
  const monthName = namePart(target, { month: 'short' });
  if (year !== parseIso(today)[0]) return `${day} ${monthName} ${year}`;
  return `${namePart(target, { weekday: 'short' })} ${day} ${monthName}`;
}

/** When something happened, the way a person would say it: "hoy, 9:40",
 *  "ayer, 21:15", "vie 18 sept, 9:40". `today` is yyyy-mm-dd; `timestamp` an
 *  ISO instant, told in the device's time zone. */
export function relativeDayTime(today: string, timestamp: string): string {
  const at = new Date(timestamp);
  const day = toIso(at.getFullYear(), at.getMonth() + 1, at.getDate());
  const time = at.toLocaleTimeString('es-AR', { hour: 'numeric', minute: '2-digit' });
  return `${relativeDay(today, day)}, ${time}`;
}

/** A day heading: "Jueves 27", or "Jueves 27 ago" when `withMonth`. */
export function formatWeekdayDay(dateStr: string, withMonth: boolean): string {
  const [year, month, day] = parseIso(dateStr);
  const date = new Date(year, month - 1, day);
  const weekday = capitalize(namePart(date, { weekday: 'long' }));
  return withMonth
    ? `${weekday} ${day} ${namePart(date, { month: 'short' })}`
    : `${weekday} ${day}`;
}

/**
 * The month of a yyyy-mm string as a heading: "Marzo" when it falls in
 * `currentYear`, "Marzo 2027" otherwise.
 */
export function monthLabel(yearMonth: string, currentYear: number): string {
  const year = Number(yearMonth.split('-')[0]);
  const name = capitalize(monthName(yearMonth, 'long'));
  return year === currentYear ? name : `${name} ${year}`;
}

/** The month of a yyyy-mm string (or a date in it) by its es-AR name, lower-case
 *  and without the abbreviation dot: "agosto", or "ago" when `style` is short. */
export function monthName(yearMonth: string, style: 'long' | 'short'): string {
  const [year, month] = yearMonth.split('-').map(Number);
  return namePart(new Date(year, month - 1, 1), { month: style });
}

/** The notice windows the apps offer, by their label; any other count of
 *  days is spelled out. */
const NOTICE_LABELS: Record<number, string> = {
  0: 'Aviso: el día',
  1: '1 día antes',
  3: '3 días antes',
  7: '1 semana antes',
  14: '2 semanas antes',
  30: '1 mes antes',
  90: '3 meses antes',
  180: '6 meses antes',
};

/** How far ahead an entry announces itself, as shown to the user. */
export function noticeLabel(days: number): string {
  return NOTICE_LABELS[days] ?? `${days} días antes`;
}
