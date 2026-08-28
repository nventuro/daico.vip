// =============================================================================
// What a statement holds once read from the bank's PDF. Each layout the app
// knows has a parser under parsers/, tried in turn on the positioned words of
// the pages; the result is the contents that get sealed into the row's
// payload. Nothing here touches the store.
// =============================================================================
import type { StatementFormat } from '../../types';

/** A word of a PDF page with its horizontal extent, in page units. A layout
 *  is read by where a word sits as much as by what it says. */
export interface PositionedWord {
  text: string;
  x0: number;
  x1: number;
}

/** The words of one line of a page, left to right. */
export type PageLine = PositionedWord[];

/** One movement on the statement: a purchase, one installment of one, or a
 *  charge of the bank's own. */
export interface StatementLine {
  /** yyyy-mm-dd */
  on: string;
  /** The merchant line as printed. */
  description: string;
  /** Which installment of how many, for a purchase paid in several. */
  installment: { number: number; of: number } | null;
  ars_cents: number;
  usd_cents: number;
  /** A charge of the bank's own — a tax withheld — rather than a purchase. */
  charge: boolean;
  /** Set apart from the month's usual spending, by the user. */
  one_off: boolean;
}

/** Everything read from a statement; what the payload seals. */
export interface StatementContents {
  schema: number;
  format: StatementFormat;
  /** The bank's own number for it. */
  number: string;
  /** The day the statement before it closed (yyyy-mm-dd): this one runs from
   *  the day after. Null when the payload predates it. */
  previous_closed_on: string | null;
  closed_on: string;
  due_on: string;
  /** What the previous statement came to. */
  previous_ars_cents: number;
  previous_usd_cents: number;
  /** Of the previous statement, what was left unpaid and carried into the total. */
  pending_ars_cents: number;
  pending_usd_cents: number;
  minimum_ars_cents: number | null;
  total_ars_cents: number;
  total_usd_cents: number;
  /** Pesos per dollar the bank valued the dollar spend at, when it can be told. */
  usd_rate: number | null;
  lines: StatementLine[];
}

/** A PDF of a known layout that could not be read whole; the message says
 *  why, in the user's words. Nothing of it is kept. */
export class StatementError extends Error {}

/** Thrown by a parser whose layout the pages do not follow, so the next one
 *  is tried. */
export class UnknownLayout extends Error {
  constructor() {
    super('Not this layout');
  }
}

/** `contents` with a line marked one-off wherever `previous` had the same
 *  movement marked — for a statement imported again. */
export function withOneOffsFrom(
  contents: StatementContents,
  previous: StatementContents,
): StatementContents {
  const key = (line: StatementLine) =>
    [line.on, line.description, line.ars_cents, line.usd_cents].join(' ');
  const marked = new Set(previous.lines.filter((line) => line.one_off).map(key));
  return {
    ...contents,
    lines: contents.lines.map((line) =>
      marked.has(key(line)) ? { ...line, one_off: true } : line,
    ),
  };
}
