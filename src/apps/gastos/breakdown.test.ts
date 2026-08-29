import { describe, it, expect } from 'vitest';
import {
  byCategory,
  byMonth,
  largestFirst,
  lineCents,
  movementsOf,
  movementsOfMonth,
  spendParts,
  toPayCents,
  totalCents,
} from './breakdown';
import type { Rule } from './rules';
import type { StatementContents } from './statement';
import { line, statement } from './testing/contents';

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

/** The same purchase, split in six, as two statements bill it. */
const bought = statement({
  lines: [
    line({
      on: '2026-08-04',
      description: 'MUEBLERIA NORTE',
      ars_cents: 12_000,
      installment: { number: 1, of: 6 },
    }),
  ],
});
const billedLater = statement({
  closed_on: '2026-09-20',
  lines: [
    line({
      on: '2026-08-04',
      description: 'MUEBLERIA NORTE',
      ars_cents: 12_000,
      installment: { number: 2, of: 6 },
    }),
  ],
});

describe('spendParts', () => {
  it('splits the total by the mark', () => {
    expect(spendParts(movements(august), RULES)).toEqual({
      usual: 1_960_000,
      oneOff: 5_000,
      installments: 0,
    });
    expect(totalCents(august)).toBe(1_965_000);
  });

  it('counts a line its category sets apart, with no mark on it', () => {
    expect(spendParts(movements(trip), RULES)).toEqual({
      usual: 0,
      oneOff: 90_000,
      installments: 0,
    });
  });

  it('sets apart what is only being paid here, marked or not', () => {
    expect(spendParts(movements(billedLater), RULES)).toEqual({
      usual: 0,
      oneOff: 0,
      installments: 12_000,
    });
    const marked = statement({
      lines: billedLater.lines.map((l) => ({ ...l, one_off: true })),
    });
    expect(spendParts(movements(marked), RULES).installments).toBe(12_000);
  });
});

describe('movementsOfMonth', () => {
  const ids = [{ id: 'a' }, { id: 'b' }];

  it('holds a purchase whole, once, in the month it was made', () => {
    expect(
      movementsOfMonth(ids, [bought, billedLater], '2026-08').map((m) => [m.statementId, m.cents]),
    ).toEqual([['a', 72_000]]);
  });

  it('leaves out the statement that only bills a later installment', () => {
    expect(movementsOfMonth(ids, [bought, billedLater], '2026-09')).toEqual([]);
  });

  it('points a movement at the line the mark lives on', () => {
    const [movement] = movementsOfMonth(ids, [bought, billedLater], '2026-08');
    expect(movement.line.installment).toEqual({ number: 1, of: 6 });
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
      { month: '2026-08', cents: 1_975_000, usual: 1_960_000, oneOff: 15_000 },
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

  it('counts a purchase in installments whole, in the month it was made', () => {
    expect(byMonth([bought, billedLater], RULES, 'total')).toEqual([
      { month: '2026-08', cents: 72_000, usual: 72_000, oneOff: 0 },
    ]);
  });

  it('follows one category', () => {
    expect(byMonth([july, august], RULES, 'supermercado').map((m) => m.cents)).toEqual([
      10_000, 7_000,
    ]);
  });
});
