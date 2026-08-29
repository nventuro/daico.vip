import { describe, it, expect } from 'vitest';
import {
  byCategory,
  byMonth,
  largestFirst,
  lineCents,
  movementsOf,
  toPayCents,
  totalCents,
  usualAndOneOff,
} from './breakdown';
import type { Rule } from './rules';
import { withOneOffsFrom, type StatementContents, type StatementLine } from './statement';

const line = (over: Partial<StatementLine>): StatementLine => ({
  on: '2026-08-10',
  description: 'X',
  installment: null,
  ars_cents: 0,
  usd_cents: 0,
  charge: false,
  one_off: false,
  ...over,
});

const statement = (over: Partial<StatementContents>): StatementContents => ({
  schema: 2,
  format: 'galicia-visa',
  number: '1',
  previous_closed_on: '2026-07-23',
  closed_on: '2026-08-20',
  due_on: '2026-09-01',
  previous_ars_cents: 0,
  previous_usd_cents: 0,
  pending_ars_cents: 0,
  pending_usd_cents: 0,
  minimum_ars_cents: null,
  total_ars_cents: 0,
  total_usd_cents: 0,
  usd_rate: 1500,
  lines: [],
  ...over,
});

const RULES: Rule[] = [
  { id: 'r', pattern: 'TIENDA SOL', category: 'supermercado' },
  { id: 'n', pattern: 'LUMEN', category: 'suscripciones' },
  { id: 't', pattern: 'TURISMO SA', category: 'viajes' },
];

const trip = statement({
  lines: [line({ description: 'TURISMO SA 4471', ars_cents: 90_000 })],
});

const august = statement({
  lines: [
    line({ description: 'TIENDA SOL 318', ars_cents: 10_000 }),
    line({ description: 'LUMEN.COM', usd_cents: 1_000 }),
    line({
      description: 'GUBER SRL',
      ars_cents: 5_000,
      one_off: true,
      installment: { number: 1, of: 3 },
    }),
    line({ description: 'DB.RG 5617 30%', ars_cents: 450_000, charge: true }),
  ],
});

describe('lineCents', () => {
  it('values dollars at the rate, and at nothing without one', () => {
    expect(lineCents(line({ ars_cents: 100, usd_cents: 200 }), 1500)).toBe(300_100);
    expect(lineCents(line({ ars_cents: 100, usd_cents: 200 }), null)).toBe(100);
  });
});

/** Every movement of a statement, as a screen reads them. */
const movements = (contents: StatementContents) => movementsOf('s', contents);

describe('byCategory', () => {
  it('sums each category largest first, the unfiled lines under null', () => {
    expect(
      byCategory(movements(august), RULES).map((share) => [
        share.category,
        share.cents,
        share.movements.map((movement) => movement.index),
      ]),
    ).toEqual([
      ['suscripciones', 1_500_000, [1]],
      ['impuestos', 450_000, [3]],
      ['supermercado', 10_000, [0]],
      [null, 5_000, [2]],
    ]);
  });

  it('reads a month made of several statements at their own rates', () => {
    const cheap = statement({ usd_rate: 1000, lines: [line({ usd_cents: 100 })] });
    const dear = statement({ usd_rate: 2000, lines: [line({ usd_cents: 100 })] });
    const both = [...movementsOf('a', cheap), ...movementsOf('b', dear)];
    expect(byCategory(both, RULES)[0].cents).toBe(300_000);
  });
});

describe('usualAndOneOff', () => {
  it('splits the total by the mark', () => {
    expect(usualAndOneOff(movements(august), RULES)).toEqual({ usual: 1_960_000, oneOff: 5_000 });
    expect(totalCents(august)).toBe(1_965_000);
  });

  it('counts a line its category sets apart, with no mark on it', () => {
    expect(usualAndOneOff(movements(trip), RULES)).toEqual({ usual: 0, oneOff: 90_000 });
  });
});

describe('toPayCents', () => {
  it('is the printed total, the dollars at the rate', () => {
    const contents = statement({ total_ars_cents: 100, total_usd_cents: 2, usd_rate: 1500 });
    expect(toPayCents(contents)).toBe(3_100);
    expect(toPayCents({ ...contents, usd_rate: null })).toBe(100);
  });
});

describe('largestFirst', () => {
  it('orders the movements given by amount, the dollars at the rate', () => {
    expect(largestFirst(movements(august)).map((m) => m.index)).toEqual([1, 3, 0, 2]);
    expect(
      largestFirst(movements(august).filter((m) => m.index === 2 || m.index === 0)).map(
        (m) => m.index,
      ),
    ).toEqual([0, 2]);
  });
});

describe('byMonth', () => {
  // Closes in August, so by the bank's calendar it is an August statement —
  // but what it lists was bought in July.
  const july = statement({
    closed_on: '2026-08-02',
    format: 'galicia-mastercard',
    lines: [line({ on: '2026-07-28', description: 'TIENDA SOL', ars_cents: 7_000 })],
  });
  const julyVisa = statement({
    closed_on: '2026-07-20',
    lines: [line({ on: '2026-07-04', description: 'TIENDA SOL', ars_cents: 1_000, one_off: true })],
  });

  it('counts a movement in the month it was made, not the month its statement closed', () => {
    expect(byMonth([july, august, julyVisa], RULES, 'total')).toEqual([
      { month: '2026-08', cents: 1_965_000, usual: 1_960_000, oneOff: 5_000 },
      { month: '2026-07', cents: 8_000, usual: 7_000, oneOff: 1_000 },
    ]);
  });

  it('leaves the one-offs out of the usual spending', () => {
    expect(byMonth([julyVisa], RULES, 'usual')[0].cents).toBe(0);
  });

  it('leaves out what a category sets apart as well', () => {
    expect(byMonth([trip], RULES, 'usual')[0].cents).toBe(0);
    expect(byMonth([trip], RULES, 'total')[0]).toMatchObject({ usual: 0, oneOff: 90_000 });
  });

  it('follows one category', () => {
    expect(byMonth([july, august], RULES, 'supermercado').map((m) => m.cents)).toEqual([
      10_000, 7_000,
    ]);
  });
});

describe('withOneOffsFrom', () => {
  it('keeps the marks of the same movements when a statement is read again', () => {
    const before = statement({
      lines: [line({ description: 'A', ars_cents: 1, one_off: true }), line({ description: 'B' })],
    });
    const again = statement({
      lines: [
        line({ description: 'B' }),
        line({ description: 'A', ars_cents: 1 }),
        line({ description: 'C' }),
      ],
    });
    expect(withOneOffsFrom(again, before).lines.map((l) => l.one_off)).toEqual([
      false,
      true,
      false,
    ]);
  });
});
