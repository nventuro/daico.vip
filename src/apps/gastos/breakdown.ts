// =============================================================================
// The sums a statement is read through: by category, the usual against the
// one-off, and month by month across statements. All in pesos, a dollar line
// valued at its own statement's rate.
// =============================================================================
import { ONE_OFF_CATEGORIES, type SpendingCategory, type StatementFormat } from '../../types';
import { categoryOf, type Rule } from './rules';
import type { StatementContents, StatementLine } from './statement';

/** Pesos and dollars as pesos, the dollars valued at `usdRate`; dollars
 *  count for nothing when the rate is unknown. */
export function inPesos(arsCents: number, usdCents: number, usdRate: number | null): number {
  return arsCents + (usdRate === null ? 0 : Math.round(usdCents * usdRate));
}

/** A line's amount in pesos. */
export function lineCents(line: StatementLine, usdRate: number | null): number {
  return inPesos(line.ars_cents, line.usd_cents, usdRate);
}

/** What a statement's movements come to in pesos: the spending it lists,
 *  apart from any balance carried from the statement before. */
export function totalCents(contents: StatementContents): number {
  return contents.lines.reduce((acc, line) => acc + lineCents(line, contents.usd_rate), 0);
}

/** What the statement asks to be paid, in pesos. */
export function toPayCents(
  contents: Pick<StatementContents, 'total_ars_cents' | 'total_usd_cents' | 'usd_rate'>,
): number {
  return inPesos(contents.total_ars_cents, contents.total_usd_cents, contents.usd_rate);
}

/** The lines `indices` name, largest amount first. */
export function largestFirst(contents: StatementContents, indices: number[]): number[] {
  const cents = (i: number) => lineCents(contents.lines[i], contents.usd_rate);
  return [...indices].sort((a, b) => cents(b) - cents(a));
}

/** One category's share of a statement: its total and the lines in it, by
 *  their index in the statement. */
export interface CategoryShare {
  category: SpendingCategory | null;
  cents: number;
  lines: number[];
}

/** A statement by category, largest first; the lines nothing places come as
 *  the null category. */
export function byCategory(contents: StatementContents, rules: Rule[]): CategoryShare[] {
  const shares = new Map<SpendingCategory | null, CategoryShare>();
  contents.lines.forEach((line, i) => {
    const { category } = categoryOf(line, rules);
    const share = shares.get(category) ?? { category, cents: 0, lines: [] };
    share.cents += lineCents(line, contents.usd_rate);
    share.lines.push(i);
    shares.set(category, share);
  });
  return [...shares.values()].sort((a, b) => b.cents - a.cents);
}

/** Whether every movement a category holds is a one-off. */
export function isOneOffCategory(category: SpendingCategory | null): boolean {
  return category !== null && ONE_OFF_CATEGORIES.includes(category);
}

/** Whether a line is set apart from the usual spending: marked by the user,
 *  or filed under a category that is a one-off on its own. */
export function isOneOff(line: StatementLine, rules: Rule[]): boolean {
  return line.one_off || isOneOffCategory(categoryOf(line, rules).category);
}

/** What the usual spending and the one-offs come to. */
export function usualAndOneOff(
  contents: StatementContents,
  rules: Rule[],
): { usual: number; oneOff: number } {
  let usual = 0;
  let oneOff = 0;
  for (const line of contents.lines) {
    const value = lineCents(line, contents.usd_rate);
    if (isOneOff(line, rules)) oneOff += value;
    else usual += value;
  }
  return { usual, oneOff };
}

/** `part` as a whole percentage of `whole`; 0 when there is no whole. */
export function percent(part: number, whole: number): number {
  return whole === 0 ? 0 : Math.round((part / whole) * 100);
}

/** The yyyy-mm a statement belongs to: the month it closed. */
export function monthOf(contents: Pick<StatementContents, 'closed_on'>): string {
  return contents.closed_on.slice(0, 7);
}

/** What to sum month by month: everything, the usual spending alone, or one category. */
export type TrendPick = 'total' | 'usual' | SpendingCategory;

/** One month across every statement that closed in it. */
export interface MonthTotal {
  /** yyyy-mm */
  month: string;
  cents: number;
  usual: number;
  oneOff: number;
  /** The layouts of the statements the month has. */
  formats: StatementFormat[];
}

/** Every month with a statement, newest first, summing what `pick` names. */
export function byMonth(all: StatementContents[], rules: Rule[], pick: TrendPick): MonthTotal[] {
  const months = new Map<string, MonthTotal>();
  for (const contents of all) {
    const month = monthOf(contents);
    const row = months.get(month) ?? { month, cents: 0, usual: 0, oneOff: 0, formats: [] };
    if (!row.formats.includes(contents.format)) row.formats.push(contents.format);
    for (const line of contents.lines) {
      const oneOff = isOneOff(line, rules);
      if (pick === 'usual' && oneOff) continue;
      if (pick !== 'total' && pick !== 'usual' && categoryOf(line, rules).category !== pick)
        continue;
      const value = lineCents(line, contents.usd_rate);
      row.cents += value;
      if (oneOff) row.oneOff += value;
      else row.usual += value;
    }
    months.set(month, row);
  }
  return [...months.values()].sort((a, b) => b.month.localeCompare(a.month));
}
