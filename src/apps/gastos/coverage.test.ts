import { describe, it, expect } from 'vitest';
import { cardCloses, coverageByCard, coveredMonths, monthCoverage } from './coverage';
import type { StatementContents } from './statement';

/** A statement is only its card and the days it covers here. */
const statement = (
  format: StatementContents['format'],
  previousClosedOn: string | null,
  closedOn: string,
): StatementContents => ({
  schema: 2,
  format,
  number: closedOn,
  previous_closed_on: previousClosedOn,
  closed_on: closedOn,
  due_on: closedOn,
  previous_ars_cents: 0,
  previous_usd_cents: 0,
  pending_ars_cents: 0,
  pending_usd_cents: 0,
  minimum_ars_cents: null,
  total_ars_cents: 0,
  total_usd_cents: 0,
  usd_rate: null,
  lines: [],
});

// One card closing around the 20th and another around the 28th, which is what
// leaves a calendar month with only one of them.
const VISA = [
  statement('galicia-visa', '2026-03-19', '2026-04-23'),
  statement('galicia-visa', '2026-04-23', '2026-05-21'),
  statement('galicia-visa', '2026-05-21', '2026-06-25'),
];
const MASTERCARD = [
  statement('galicia-mastercard', '2026-03-26', '2026-04-30'),
  statement('galicia-mastercard', '2026-04-30', '2026-05-28'),
  statement('galicia-mastercard', '2026-05-28', '2026-07-02'),
];

describe('cardCloses', () => {
  it('reads every card by its last closing day', () => {
    expect(cardCloses([...VISA, ...MASTERCARD], '2026-07-10')).toEqual([
      { format: 'galicia-mastercard', lastClosedOn: '2026-07-02', daysSinceClose: 8, late: false },
      { format: 'galicia-visa', lastClosedOn: '2026-06-25', daysSinceClose: 15, late: false },
    ]);
  });

  it('calls a card late only once the day its statement was due to come by is past', () => {
    // The visa closed on 25/06, so the next one was due to be in hand by 27/07.
    expect(cardCloses(VISA, '2026-07-27')[0].late).toBe(false);
    expect(cardCloses(VISA, '2026-07-28')[0].late).toBe(true);
  });
});

describe('coverageByCard', () => {
  it('joins the periods of a card that chain, and finds no hole', () => {
    const [visa] = coverageByCard(VISA, '2026-06-30');
    expect(visa.covered).toEqual([{ from: '2026-03-20', to: '2026-06-25' }]);
    expect(visa.gaps).toEqual([]);
  });

  it('names the days a statement that never came in would have covered', () => {
    // Cards come alphabetically, so mastercard is first.
    const [mastercard] = coverageByCard([...VISA, MASTERCARD[0], MASTERCARD[2]], '2026-07-05');
    expect(mastercard.gaps).toEqual([{ from: '2026-05-01', to: '2026-05-28' }]);
    expect(mastercard.covered).toEqual([
      { from: '2026-03-27', to: '2026-04-30' },
      { from: '2026-05-29', to: '2026-07-02' },
    ]);
  });

  it('says how long a card has had nothing new, and when that is too long', () => {
    const [visa] = coverageByCard(VISA, '2026-07-20');
    expect(visa.daysSinceClose).toBe(25);
    expect(visa.late).toBe(false);
    expect(coverageByCard(VISA, '2026-08-15')[0].late).toBe(true);
  });
});

describe('monthCoverage', () => {
  const cards = coverageByCard([...VISA, ...MASTERCARD], '2026-07-05');

  it('calls a month whole when every card covers it end to end', () => {
    expect(monthCoverage('2026-05', cards)).toEqual({ whole: true, short: [] });
  });

  it('says which card stops mid-month', () => {
    // Mastercard's 28/05 to 02/07 statement covers June whole; the visa one
    // closed on the 25th and the next has not come in.
    expect(monthCoverage('2026-06', cards)).toEqual({
      whole: false,
      short: [{ format: 'galicia-visa', kind: 'until', day: '2026-06-25' }],
    });
  });

  it('says which card covers none of a month', () => {
    expect(monthCoverage('2026-07', cards).short).toEqual([
      { format: 'galicia-mastercard', kind: 'until', day: '2026-07-02' },
      { format: 'galicia-visa', kind: 'none' },
    ]);
  });

  it('marks the first month, which the statements only reach into', () => {
    expect(monthCoverage('2026-03', cards).short).toEqual([
      { format: 'galicia-mastercard', kind: 'since', day: '2026-03-27' },
      { format: 'galicia-visa', kind: 'since', day: '2026-03-20' },
    ]);
  });

  it('says a month is short because a statement is missing, not because the record starts there', () => {
    const holed = coverageByCard([MASTERCARD[0], MASTERCARD[2]], '2026-07-05');
    expect(monthCoverage('2026-05', holed).short).toEqual([
      { format: 'galicia-mastercard', kind: 'gap' },
    ]);
  });
});

describe('coveredMonths', () => {
  it('lists every month a card reaches into, newest first', () => {
    expect(coveredMonths(coverageByCard([...VISA, ...MASTERCARD], '2026-07-05'))).toEqual([
      '2026-07',
      '2026-06',
      '2026-05',
      '2026-04',
      '2026-03',
    ]);
  });

  it('leaves out a month no statement covers a day of, whatever is dated in it', () => {
    // Installments of a purchase made before the oldest statement land in a
    // month nothing was read for: it is not the household's spending that
    // month, so it is not a month.
    expect(coveredMonths(coverageByCard(VISA, '2026-06-30'))).not.toContain('2026-02');
  });
});
