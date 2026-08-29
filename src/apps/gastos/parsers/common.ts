// =============================================================================
// What the bank's layouts share: Argentine amounts, dates in two spellings,
// the amount columns at the right edge of the page and the header every page
// carries.
// =============================================================================
import {
  StatementError,
  type PageLine,
  type PositionedWord,
  type StatementLine,
} from '../statement';

/** An amount whose right edge is from here on sits in the pesos column… */
const ARS_COLUMN_MIN_X1 = 480;
/** …and from here on in the dollars column. */
const USD_COLUMN_MIN_X1 = 540;

const AMOUNT = /^-?\d{1,3}(\.\d{3})*,\d\d$|^-?\d+,\d\d$/;

const MONTH_BY_PREFIX: Record<string, number> = {
  ene: 1,
  feb: 2,
  mar: 3,
  abr: 4,
  may: 5,
  jun: 6,
  jul: 7,
  ago: 8,
  sep: 9,
  set: 9,
  oct: 10,
  nov: 11,
  dic: 12,
};

const pad2 = (n: number) => String(n).padStart(2, '0');

/** The month (1-12) a Spanish name or abbreviation stands for, or null. */
function monthNumber(name: string): number | null {
  return MONTH_BY_PREFIX[name.toLowerCase().slice(0, 3)] ?? null;
}

/** An amount printed the Argentine way ("1.234,56", "-3,00") in cents, or
 *  null for anything else. */
export function cents(text: string): number | null {
  if (!AMOUNT.test(text)) return null;
  const negative = text.startsWith('-');
  const [whole, fraction] = text.replace('-', '').replace(/\./g, '').split(',');
  const value = Number(whole) * 100 + Number(fraction);
  return negative ? -value : value;
}

/** A "dd-mm-yy" date as yyyy-mm-dd, or null. */
export function isoFromNumericDate(text: string): string | null {
  const m = /^(\d\d)-(\d\d)-(\d\d)$/.exec(text);
  return m ? `20${m[3]}-${m[2]}-${m[1]}` : null;
}

/** A "dd-Mmm-yy" date ("07-Ago-26") as yyyy-mm-dd, or null. */
export function isoFromNamedDate(text: string): string | null {
  const m = /^(\d\d)-([A-Za-z]{3})-(\d\d)$/.exec(text);
  const month = m && monthNumber(m[2]);
  return m && month ? `20${m[3]}-${pad2(month)}-${m[1]}` : null;
}

/** The line as one string, words joined by single spaces. */
export function text(line: PageLine): string {
  return line.map((w) => w.text).join(' ');
}

/** The amounts in the two right-hand columns, and the words left of them. */
export function amounts(line: PageLine): {
  ars: number | null;
  usd: number | null;
  rest: PositionedWord[];
} {
  let ars: number | null = null;
  let usd: number | null = null;
  const rest: PositionedWord[] = [];
  for (const word of line) {
    const value = cents(word.text);
    if (value !== null && word.x1 >= USD_COLUMN_MIN_X1) usd = value;
    else if (value !== null && word.x1 >= ARS_COLUMN_MIN_X1) ars = value;
    else rest.push(word);
  }
  return { ars, usd, rest };
}

/** The most installments a purchase is ever split into. A statement marks an
 *  installment "3/6"; a "07/26" past this count is a period, not one. */
const INSTALLMENTS_MAX = 24;

/** What a column of the lines comes to. */
export function sum(lines: StatementLine[], key: 'ars_cents' | 'usd_cents'): number {
  return lines.reduce((acc, line) => acc + line[key], 0);
}

/** Which installment of how many a "3/6" token says, or null when the token
 *  is not one — a "07/26" is a period. */
export function installment(token: string): { number: number; of: number } | null {
  const m = /^(\d\d)\/(\d\d)$/.exec(token);
  if (!m) return null;
  const number = Number(m[1]);
  const of = Number(m[2]);
  return number >= 1 && number <= of && of <= INSTALLMENTS_MAX ? { number, of } : null;
}

/** The statement's closing and due dates, and the previous statement's
 *  closing date, from the row of six dates every page's header carries: the
 *  previous statement's, this one's, the next's. */
export function headerDates(
  lines: PageLine[],
): { previous_closed_on: string; closed_on: string; due_on: string } | null {
  for (const line of lines) {
    const dates = text(line).split(/\s+/).map(isoFromNamedDate);
    if (dates.length === 6 && dates.every((d) => d !== null)) {
      return {
        previous_closed_on: dates[0] as string,
        closed_on: dates[2] as string,
        due_on: dates[3] as string,
      };
    }
  }
  return null;
}

/** The bank's number for the statement. */
export function statementNumber(lines: PageLine[]): string | null {
  for (const line of lines) {
    const m = /^Resumen N° (\S+)/.exec(text(line));
    if (m) return m[1];
  }
  return null;
}

/** The minimum payment: the first of the three amounts under "PAGO MINIMO". */
export function minimumPayment(lines: PageLine[]): number | null {
  let underHeading = false;
  for (const line of lines) {
    const t = text(line);
    if (t.startsWith('PAGO MINIMO')) underHeading = true;
    else if (underHeading) {
      const m = /^\$ ?([\d.]+,\d\d) \$ ?[\d.]+,\d\d \$ ?[\d.]+,\d\d$/.exec(t);
      if (m) return cents(m[1]);
    }
  }
  return null;
}

/**
 * Pesos per dollar the bank valued the dollar spend at, told from the 30%
 * withholding it charges on that spend: the charge is 30% of the spend in
 * pesos. Null when there is no such charge or no dollar spend.
 */
export function usdRate(
  charges: { description: string; ars_cents: number }[],
  totalUsdCents: number,
): number | null {
  const withholding = charges.find((c) => /\b30%/.test(c.description));
  if (!withholding || totalUsdCents <= 0) return null;
  return withholding.ars_cents / 0.3 / totalUsdCents;
}

/** Fails the read when what the lines add up to is not what the bank printed. */
export function reconcile(what: string, summed: number, printed: number, currency: string): void {
  if (summed !== printed) {
    throw new StatementError(
      `${what} suman ${money(summed, currency)} y el resumen dice ${money(printed, currency)}; no se guardó nada.`,
    );
  }
}

function money(value: number, currency: string): string {
  return `${currency} ${(value / 100).toLocaleString('en-US', { minimumFractionDigits: 2 })}`;
}
