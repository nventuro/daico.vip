import type { SpendingCategory, Statement, StatementFormat } from '../../lib/offline/specs';
import { addDays, formatDateShort, monthName, yearMonthOf } from '../../utils/dateUtils';
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

/** A difference in pesos with its sign: "+ $ 61,000", "− $ 18,000", "=" for none. */
export function formatDelta(cents: number): string {
  if (cents === 0) return '=';
  return `${cents < 0 ? '−' : '+'} $ ${number(cents, false)}`;
}

/** A change from `before` to `now` as a whole percentage with its sign:
 *  "+ 49 %"; empty when there is nothing to compare with. */
export function formatPercentDelta(now: number, before: number): string {
  if (before === 0) return '';
  const value = Math.round(((now - before) / before) * 100);
  if (value === 0) return '=';
  return `${value < 0 ? '−' : '+'} ${Math.abs(value)} %`;
}

/** How a statement is named wherever it is listed: the month it covers and
 *  the card it is for. */
export function statementTitle(statement: Pick<Statement, 'format' | 'closed_on'>): string {
  return `${monthTitle(yearMonthOf(statement.closed_on))} · ${FORMAT_LABELS[statement.format]}`;
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

/** The days a statement covers: "del 24/07/2026 al 20/08/2026", or its
 *  closing day alone when the start is not known. */
export function periodLabel(
  contents: Pick<StatementContents, 'previous_closed_on' | 'closed_on'>,
): string {
  const to = formatDateShort(contents.closed_on);
  if (contents.previous_closed_on === null) return `cierre ${to}`;
  return `del ${formatDateShort(addDays(contents.previous_closed_on, 1))} al ${to}`;
}

/** What the total carries from the statement before: what was left unpaid,
 *  or — paid more than owed — what comes off. Empty when nothing was. */
export function carriedLabel(pendingCents: number): string {
  if (pendingCents === 0) return '';
  if (pendingCents < 0)
    return `Descuenta ${formatArs(-pendingCents)} pagados de más en el resumen anterior.`;
  return `Incluye ${formatArs(pendingCents)} pendientes del resumen anterior.`;
}
