// =============================================================================
// The sums a statement and a month are read through: by category, the usual
// against the one-off, and month by month across statements. All in pesos, a
// dollar line valued at the rate of the statement it came in — which is why a
// movement is carried around already valued: a month is made of several
// statements, each with a rate of its own.
// =============================================================================
import type { SpendingCategory } from '../../lib/offline/specs';
import { yearMonthOf } from '../../utils/dateUtils';
import { categoryOf, type Rule } from './rules';
import type { StatementContents, StatementLine } from './statement';

/** Pesos and dollars as pesos, the dollars valued at `usdRate`; dollars
 *  count for nothing when the rate is unknown. */
function inPesos(arsCents: number, usdCents: number, usdRate: number | null): number {
  return arsCents + (usdRate === null ? 0 : Math.round(usdCents * usdRate));
}

/** A line's amount in pesos. */
export function lineCents(line: StatementLine, usdRate: number | null): number {
  return inPesos(line.ars_cents, line.usd_cents, usdRate);
}

/** One installment of a purchase made before the statement that bills it —
 *  every installment but the first. A statement lists these because they have
 *  to be paid; no month counts them, since the purchase is already whole in
 *  the month it was made. */
export function isLaterInstallment(line: StatementLine): boolean {
  return line.installment !== null && line.installment.number > 1;
}

/** What the purchase behind a line came to, in pesos: a line paid in one go is
 *  itself, and a first installment stands for the whole purchase — the bank
 *  charges the same amount every month for the life of the plan, so the price
 *  is known from the statement that first bills it. */
export function purchaseCents(line: StatementLine, usdRate: number | null): number {
  return lineCents(line, usdRate) * (line.installment?.of ?? 1);
}

/** One movement, already in pesos, and where to find it again: marking it
 *  rewrites the statement that holds it, at that place in its lines. */
export interface Movement {
  line: StatementLine;
  cents: number;
  statementId: string;
  index: number;
}

/** Every movement of one statement. */
export function movementsOf(statementId: string, contents: StatementContents): Movement[] {
  return contents.lines.map((line, index) => ({
    line,
    cents: lineCents(line, contents.usd_rate),
    statementId,
    index,
  }));
}

/**
 * The purchases of `month` (yyyy-mm) across every statement given, by the day
 * each was made — the day the bank prints, which for an installment is the day
 * the purchase was made, not the day it is charged. A purchase split into
 * installments is one movement for the whole price, from the statement that
 * bills its first: how it is being paid says nothing about what was spent.
 */
export function movementsOfMonth(
  statements: { id: string }[],
  all: StatementContents[],
  month: string,
): Movement[] {
  return statements.flatMap((statement, i) => {
    const contents = all[i];
    if (!contents) return [];
    return contents.lines.flatMap((line, index) =>
      yearMonthOf(line.on) === month && !isLaterInstallment(line)
        ? [
            {
              line,
              cents: purchaseCents(line, contents.usd_rate),
              statementId: statement.id,
              index,
            },
          ]
        : [],
    );
  });
}

/** What movements come to. */
export function sumCents(movements: Movement[]): number {
  return movements.reduce((acc, movement) => acc + movement.cents, 0);
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

/** The movements given, largest amount first. */
export function largestFirst(movements: Movement[]): Movement[] {
  return [...movements].sort((a, b) => b.cents - a.cents);
}

/** One category's share: its total and the movements in it. */
export interface CategoryShare {
  category: SpendingCategory | null;
  cents: number;
  movements: Movement[];
}

/** Movements by category, largest first; the ones nothing places come as the
 *  null category. */
export function byCategory(movements: Movement[], rules: Rule[]): CategoryShare[] {
  const shares = new Map<SpendingCategory | null, CategoryShare>();
  for (const movement of movements) {
    const { category } = categoryOf(movement.line, rules);
    const share = shares.get(category) ?? { category, cents: 0, movements: [] };
    share.cents += movement.cents;
    share.movements.push(movement);
    shares.set(category, share);
  }
  return [...shares.values()].sort((a, b) => b.cents - a.cents);
}

/** The categories whose movements are one-offs on their own: a trip is never
 *  part of a month's usual spending, so it needs no mark of its own. */
const ONE_OFF_CATEGORIES: readonly SpendingCategory[] = ['viajes'];

/** Whether every movement a category holds is a one-off. */
export function isOneOffCategory(category: SpendingCategory | null): boolean {
  return category !== null && ONE_OFF_CATEGORIES.includes(category);
}

/** Whether a line is set apart from the usual spending: marked by the user,
 *  or filed under a category that is a one-off on its own. */
export function isOneOff(line: StatementLine, rules: Rule[]): boolean {
  return line.one_off || isOneOffCategory(categoryOf(line, rules).category);
}

/**
 * How the movements given divide: what was bought here and counts as usual,
 * what was bought here and is set apart, and what is only being paid here.
 * The last is always nothing on a month, which holds every purchase whole in
 * the month it was made; on a statement it is what the bank is charging for
 * purchases of earlier months, which is not spending of this one either way,
 * so the mark on it never comes into the split.
 */
export function spendParts(
  movements: Movement[],
  rules: Rule[],
): { usual: number; oneOff: number; installments: number } {
  let usual = 0;
  let oneOff = 0;
  let installments = 0;
  for (const movement of movements) {
    if (isLaterInstallment(movement.line)) installments += movement.cents;
    else if (isOneOff(movement.line, rules)) oneOff += movement.cents;
    else usual += movement.cents;
  }
  return { usual, oneOff, installments };
}

/** `part` as a whole percentage of `whole`; 0 when there is no whole. */
export function percent(part: number, whole: number): number {
  return whole === 0 ? 0 : Math.round((part / whole) * 100);
}

/** The yyyy-mm a statement closed in. */
export function monthOf(contents: Pick<StatementContents, 'closed_on'>): string {
  return yearMonthOf(contents.closed_on);
}

/** What to sum month by month: everything, the usual spending alone, or one category. */
export type TrendPick = 'total' | 'usual' | SpendingCategory;

/** One calendar month across every statement that carries a movement made in it. */
export interface MonthTotal {
  /** yyyy-mm */
  month: string;
  cents: number;
  usual: number;
  oneOff: number;
}

/**
 * Every month with a purchase in it, newest first, summing what `pick` names.
 * A purchase counts once, whole, in the month it was made — not the month its
 * statement closed, and not spread over the months the bank charges it in:
 * the closing calendar is the bank's, and two cards never share it.
 */
export function byMonth(all: StatementContents[], rules: Rule[], pick: TrendPick): MonthTotal[] {
  const months = new Map<string, MonthTotal>();
  for (const contents of all) {
    for (const line of contents.lines) {
      if (isLaterInstallment(line)) continue;
      const month = yearMonthOf(line.on);
      const row = months.get(month) ?? { month, cents: 0, usual: 0, oneOff: 0 };
      months.set(month, row);
      const oneOff = isOneOff(line, rules);
      if (pick === 'usual' && oneOff) continue;
      if (pick !== 'total' && pick !== 'usual' && categoryOf(line, rules).category !== pick)
        continue;
      const value = purchaseCents(line, contents.usd_rate);
      row.cents += value;
      if (oneOff) row.oneOff += value;
      else row.usual += value;
    }
  }
  return [...months.values()].sort((a, b) => b.month.localeCompare(a.month));
}
