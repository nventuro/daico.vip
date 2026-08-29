// =============================================================================
// What the statements cover and where they fall short. A statement covers the
// days from the one before it closed to its own closing day, so a card's
// periods should chain; where they do not, a statement never came in, and the
// two dates around the break say exactly which days are missing. A calendar
// month is only whole once every card covers it end to end.
//
// Nothing here ever puts a number on a day no statement covers: nothing was
// read for it, so there is nothing to put.
// =============================================================================
import type { StatementFormat } from '../../lib/offline/specs';
import { addDays, addMonths, daysUntil, yearMonthOf } from '../../utils/dateUtils';
import type { StatementContents } from './statement';

/** After this long with nothing new from a card, it is late enough to say so.
 *  A cycle runs four or five weeks and the statement arrives within days of
 *  closing, so by four weeks and change the usual one is in hand. The five-week
 *  cycles do read as late for a few days before they arrive, and that is the
 *  way round to be wrong: what has not come in yet carries a payment due barely
 *  a week after it does, so waiting costs the payment while asking early only
 *  costs a card looking short for a few days. */
export const CARD_LATE_DAYS = 32;

/** A stretch of days, both ends included (yyyy-mm-dd). */
export interface Period {
  from: string;
  to: string;
}

/** Where one card stands: the days its statements cover, the days missing
 *  between them, and how long since anything new came in. */
export interface CardCoverage {
  format: StatementFormat;
  /** Oldest first, already joined where one statement meets the next. */
  covered: Period[];
  /** The days between two statements that no statement covers. */
  gaps: Period[];
  lastClosedOn: string;
  daysSinceClose: number;
  /** Nothing new for longer than `CARD_LATE_DAYS`. */
  late: boolean;
}

/** Whether the card is missing something, either way. */
export function cardIsShort(card: CardCoverage): boolean {
  return card.late || card.gaps.length > 0;
}

/** The days a statement covers: from the day after the one before it closed,
 *  through its own closing day. A payload from before the previous closing
 *  day was kept falls back to the statement it follows here, and covers only
 *  its closing day when there is none. */
function periodOf(contents: StatementContents, before: StatementContents | undefined): Period {
  const start = contents.previous_closed_on ?? before?.closed_on ?? null;
  return {
    from: start === null ? contents.closed_on : addDays(start, 1),
    to: contents.closed_on,
  };
}

/** Every card the household has, by what its statements cover on `today`. */
export function coverageByCard(all: StatementContents[], today: string): CardCoverage[] {
  const byFormat = new Map<StatementFormat, StatementContents[]>();
  for (const contents of all) {
    const list = byFormat.get(contents.format) ?? [];
    list.push(contents);
    byFormat.set(contents.format, list);
  }

  return [...byFormat.entries()]
    .map(([format, list]) => {
      const sorted = [...list].sort((a, b) => a.closed_on.localeCompare(b.closed_on));
      const covered: Period[] = [];
      const gaps: Period[] = [];
      sorted.forEach((contents, i) => {
        const period = periodOf(contents, sorted[i - 1]);
        const last = covered[covered.length - 1];
        if (!last) covered.push({ ...period });
        else if (period.from <= addDays(last.to, 1)) {
          if (period.to > last.to) last.to = period.to;
        } else {
          gaps.push({ from: addDays(last.to, 1), to: addDays(period.from, -1) });
          covered.push({ ...period });
        }
      });
      const lastClosedOn = sorted[sorted.length - 1].closed_on;
      const daysSinceClose = daysUntil(lastClosedOn, today);
      return {
        format,
        covered,
        gaps,
        lastClosedOn,
        daysSinceClose,
        late: daysSinceClose > CARD_LATE_DAYS,
      };
    })
    .sort((a, b) => a.format.localeCompare(b.format));
}

/** How a card falls short of a month: it covers none of it, only up to a day,
 *  only from a day on, or all but a stretch in the middle. */
export type Shortfall =
  | { format: StatementFormat; kind: 'none' }
  | { format: StatementFormat; kind: 'gap' }
  | { format: StatementFormat; kind: 'until'; day: string }
  | { format: StatementFormat; kind: 'since'; day: string };

/** Whether a month is whole, and what each card that leaves it short is
 *  missing. */
export interface MonthCoverage {
  whole: boolean;
  short: Shortfall[];
}

/** The first and last day of a yyyy-mm. */
export function monthDays(month: string): Period {
  const from = `${month}-01`;
  return { from, to: addDays(addMonths(from, 1), -1) };
}

/** Where every card stands against one month. */
export function monthCoverage(month: string, cards: CardCoverage[]): MonthCoverage {
  const { from, to } = monthDays(month);
  const short: Shortfall[] = [];
  for (const card of cards) {
    // A statement that never came in beats every other reading of the month:
    // days are missing because something is missing, not because the record
    // starts or ends there.
    if (card.gaps.some((gap) => gap.from <= to && gap.to >= from)) {
      short.push({ format: card.format, kind: 'gap' });
      continue;
    }
    const inside = card.covered.filter((period) => period.from <= to && period.to >= from);
    if (inside.length === 0) {
      short.push({ format: card.format, kind: 'none' });
      continue;
    }
    if (inside[inside.length - 1].to < to)
      short.push({ format: card.format, kind: 'until', day: inside[inside.length - 1].to });
    else if (inside[0].from > from)
      short.push({ format: card.format, kind: 'since', day: inside[0].from });
  }
  return { whole: short.length === 0, short };
}

/**
 * Every month a card covers a day of, newest first. A month outside them is
 * not listed at all: what is known of it are the installments of purchases
 * made in it that came in with a later statement, which is not what the
 * household spent that month.
 */
export function coveredMonths(cards: CardCoverage[]): string[] {
  const months = new Set<string>();
  for (const card of cards) {
    for (const period of card.covered) {
      const end = yearMonthOf(period.to);
      let month = yearMonthOf(period.from);
      while (month <= end) {
        months.add(month);
        month = yearMonthOf(addMonths(`${month}-01`, 1));
      }
    }
  }
  return [...months].sort((a, b) => b.localeCompare(a));
}
