import { describe, it, expect } from 'vitest';
import {
  byCategory,
  byHolder,
  byMonth,
  installmentLines,
  lineCents,
  totalCents,
  usualAndOneOff,
} from './breakdown';
import type { Rule } from './rules';
import { withOneOffsFrom, type StatementContents, type StatementLine } from './statement';

const line = (over: Partial<StatementLine>): StatementLine => ({
  on: '2026-08-10',
  holder: 'UNO',
  description: 'X',
  installment: null,
  ars_cents: 0,
  usd_cents: 0,
  charge: false,
  one_off: false,
  ...over,
});

const statement = (over: Partial<StatementContents>): StatementContents => ({
  schema: 1,
  format: 'galicia-visa',
  number: '1',
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
  holders: [{ holder: 'UNO', last4: '1111', ars_cents: 0, usd_cents: 0 }],
  lines: [],
  installments_due: [],
  ...over,
});

const RULES: Rule[] = [
  { id: 'r', pattern: 'TIENDA SOL', category: 'supermercado' },
  { id: 'n', pattern: 'LUMEN', category: 'suscripciones' },
];

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
    line({ description: 'DB.RG 5617 30%', ars_cents: 450_000, charge: true, holder: null }),
  ],
});

describe('lineCents', () => {
  it('values dollars at the rate, and at nothing without one', () => {
    expect(lineCents(line({ ars_cents: 100, usd_cents: 200 }), 1500)).toBe(300_100);
    expect(lineCents(line({ ars_cents: 100, usd_cents: 200 }), null)).toBe(100);
  });
});

describe('byCategory', () => {
  it('sums each category largest first, the unfiled lines under null', () => {
    expect(byCategory(august, RULES)).toEqual([
      { category: 'suscripciones', cents: 1_500_000, lines: [1] },
      { category: 'impuestos', cents: 450_000, lines: [3] },
      { category: 'supermercado', cents: 10_000, lines: [0] },
      { category: null, cents: 5_000, lines: [2] },
    ]);
  });
});

describe('usualAndOneOff', () => {
  it('splits the total by the mark', () => {
    expect(usualAndOneOff(august)).toEqual({ usual: 1_960_000, oneOff: 5_000 });
    expect(totalCents(august)).toBe(1_965_000);
  });
});

describe('byHolder', () => {
  it("lists each card in pesos, then the bank's charges", () => {
    const contents = statement({
      holders: [{ holder: 'UNO', last4: '1111', ars_cents: 100, usd_cents: 2 }],
      lines: [line({ ars_cents: 40, charge: true, holder: null })],
    });
    expect(byHolder(contents)).toEqual([
      { holder: 'UNO', last4: '1111', cents: 3_100 },
      { holder: null, last4: null, cents: 40 },
    ]);
  });
});

describe('installmentLines', () => {
  it('finds the lines that are installments', () => {
    expect(installmentLines(august)).toEqual([2]);
  });
});

describe('byMonth', () => {
  const july = statement({
    closed_on: '2026-07-23',
    format: 'galicia-mastercard',
    lines: [line({ description: 'TIENDA SOL', ars_cents: 7_000 })],
  });
  const julyVisa = statement({
    closed_on: '2026-07-20',
    lines: [line({ description: 'TIENDA SOL', ars_cents: 1_000, one_off: true })],
  });

  it('sums every statement closed in a month, newest month first', () => {
    expect(byMonth([july, august, julyVisa], RULES, 'total')).toEqual([
      {
        month: '2026-08',
        cents: 1_965_000,
        usual: 1_960_000,
        oneOff: 5_000,
        formats: ['galicia-visa'],
      },
      {
        month: '2026-07',
        cents: 8_000,
        usual: 7_000,
        oneOff: 1_000,
        formats: ['galicia-mastercard', 'galicia-visa'],
      },
    ]);
  });

  it('leaves the one-offs out of the usual spending', () => {
    expect(byMonth([julyVisa], RULES, 'usual')[0].cents).toBe(0);
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
