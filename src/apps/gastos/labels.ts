import type { SpendingCategory, StatementFormat } from '../../lib/offline/specs';
import { addDays, formatDateCompact, formatDayMonth, monthName } from '../../utils/dateUtils';
import type { CardCoverage, Shortfall } from './coverage';
import type { StatementContents } from './statement';

/** Under this many pesos (in cents) an amount written in thousands keeps a
 *  decimal ("45.7k"); from here on it is whole thousands ("123k"). */
const COMPACT_AMOUNT_DECIMAL_BELOW_CENTS = 100_000 * 100;

/** Each category as shown to the user. */
export const CATEGORY_LABELS: Record<SpendingCategory, string> = {
  salidas: 'Salidas',
  supermercado: 'Supermercado',
  salud: 'Salud',
  auto: 'Auto',
  hogar: 'Hogar',
  suscripciones: 'Suscripciones',
  entretenimiento: 'Entretenimiento',
  compras: 'Compras',
  viajes: 'Viajes',
  mascotas: 'Mascotas',
  transporte: 'Transporte',
  impuestos: 'Impuestos',
  otros: 'Otros',
};

/** What the lines no rule places are listed under. */
export const UNCATEGORIZED_LABEL = 'Sin categoría';

/** Each layout by the card it is for. */
export const FORMAT_LABELS: Record<StatementFormat, string> = {
  'galicia-visa': 'visa',
  'galicia-mastercard': 'mastercard',
};

const capitalize = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

function number(cents: number, withCents: boolean): string {
  return (Math.abs(cents) / 100).toLocaleString('en-US', {
    minimumFractionDigits: withCents ? 2 : 0,
    maximumFractionDigits: withCents ? 2 : 0,
  });
}

/** Pesos as people read them: "$ 4,413,875", or "$ 4,413,874.92" with the cents. */
export function formatArs(cents: number, withCents = false): string {
  return `${cents < 0 ? '−' : ''}$ ${number(cents, withCents)}`;
}

/** Pesos in thousands, tight, for a row with no room: "$ 123k", or with a
 *  decimal under COMPACT_AMOUNT_DECIMAL_BELOW_CENTS: "$ 45.7k"; from a
 *  million, in millions to the thousand, trailing zeros dropped: "$ 1.235m",
 *  "$ 1.25m". */
export function formatArsCompact(cents: number): string {
  const sign = cents < 0 ? '−' : '';
  const thousands = Math.abs(cents) / 100_000;
  if (Math.round(thousands) >= 1000) {
    const millions = (thousands / 1000).toLocaleString('en-US', { maximumFractionDigits: 3 });
    return `${sign}$ ${millions}m`;
  }
  const decimals = Math.abs(cents) < COMPACT_AMOUNT_DECIMAL_BELOW_CENTS ? 1 : 0;
  return `${sign}$ ${thousands.toLocaleString('en-US', { maximumFractionDigits: decimals })}k`;
}

/** Dollars, always with the cents: "US$ 617.44". */
export function formatUsd(cents: number): string {
  return `${cents < 0 ? '−' : ''}US$ ${number(cents, true)}`;
}

/** A difference in pesos with its sign: "+ $ 61,000", "− $ 18,000", "$ 0". */
export function formatDelta(cents: number): string {
  if (cents === 0) return '$ 0';
  return `${cents < 0 ? '−' : '+'} $ ${number(cents, false)}`;
}

/** A change from `before` to `now` as a whole percentage, or null when there
 *  is nothing to compare against. */
export function percentDelta(now: number, before: number): number | null {
  return before === 0 ? null : Math.round(((now - before) / before) * 100);
}

/** A whole percentage change with its sign: "+ 49 %", "− 3 %". Spending that
 *  came to what it came to before is the number it is, "0 %": a period is
 *  never told it is the same as another, only how far off it is. */
export function formatPercentDelta(value: number): string {
  if (value === 0) return '0 %';
  return `${value < 0 ? '−' : '+'} ${Math.abs(value)} %`;
}

/** A day without its leading zero. */
const day = (date: string) => String(Number(date.slice(8)));

/**
 * The days a statement covers, in numbers and tight enough for a row:
 * "03/07 – 30/07/26", or "24/12/25 – 22/01/26" when it runs into a new year,
 * where the year of both ends is worth writing.
 */
export function periodShort(from: string, to: string): string {
  const start =
    from.slice(0, 4) === to.slice(0, 4) ? formatDayMonth(from) : formatDateCompact(from);
  return `${start} – ${formatDateCompact(to)}`;
}

/** How a statement is named wherever it is listed: the days it covers, the
 *  card said by the mark beside it — never the month it closed in, which two
 *  statements of the same card can share. */
export function statementTitle(
  contents: Pick<StatementContents, 'previous_closed_on' | 'closed_on'>,
): string {
  return contents.previous_closed_on === null
    ? `cierre ${formatDateCompact(contents.closed_on)}`
    : periodShort(addDays(contents.previous_closed_on, 1), contents.closed_on);
}

/** What a card that has gone too long without closing again says under its
 *  row: when the last statement closed, and how long ago that was. */
export function lateLabel(card: CardCoverage): string {
  return `el último cerró el ${formatDateCompact(card.lastClosedOn)}, hace ${card.daysSinceClose} días`;
}

function shortfallSentence(short: Shortfall, month: string): string {
  const card = FORMAT_LABELS[short.format];
  const when = monthName(month, 'long');
  switch (short.kind) {
    case 'none':
      return `Falta el resumen de ${card} de ${when}.`;
    case 'gap':
      return `Falta un resumen de ${card} de ${when}.`;
    case 'until':
      return `La ${card} de ${when} llega hasta el ${day(short.day)}.`;
    case 'since':
      return `La ${card} de ${when} arranca el ${day(short.day)}.`;
  }
}

/** Why a month is not whole, in a sentence per card that leaves it short. */
export function shortfallLabel(short: Shortfall[], month: string): string {
  return short.map((one) => shortfallSentence(one, month)).join(' ');
}

/** A yyyy-mm (or a date in it) as its month and year: "Agosto 2026". */
export function monthTitle(yearMonth: string): string {
  const [year] = yearMonth.split('-');
  return `${capitalize(monthName(yearMonth, 'long'))} ${year}`;
}

/** A yyyy-mm as a short month and year: "sep 2026". */
export function monthShort(yearMonth: string): string {
  const [year] = yearMonth.split('-');
  return `${monthName(yearMonth, 'short')} ${year}`;
}

/** The days a statement covers: "del 24/07/26 al 20/08/26", or its
 *  closing day alone when the start is not known. */
export function periodLabel(
  contents: Pick<StatementContents, 'previous_closed_on' | 'closed_on'>,
): string {
  const to = formatDateCompact(contents.closed_on);
  if (contents.previous_closed_on === null) return `cierre ${to}`;
  return `del ${formatDateCompact(addDays(contents.previous_closed_on, 1))} al ${to}`;
}

/** What the total carries from the statement before: what was left unpaid,
 *  or — paid more than owed — what comes off. Empty when nothing was. */
export function carriedLabel(pendingCents: number): string {
  if (pendingCents === 0) return '';
  if (pendingCents < 0)
    return `Descuenta ${formatArs(-pendingCents)} pagados de más en el resumen anterior.`;
  return `Incluye ${formatArs(pendingCents)} pendientes del resumen anterior.`;
}
