import { describe, it, expect } from 'vitest';
import {
  STATEMENT_CONTENTS_SCHEMA,
  purchaseKey,
  withOneOff,
  type StatementContents,
  type StatementLine,
} from './statement';

const line = (description: string, one_off = false): StatementLine => ({
  on: '2026-08-01',
  description,
  ars_cents: 1000,
  usd_cents: 0,
  installment: null,
  charge: false,
  one_off,
});

const contents: StatementContents = {
  schema: STATEMENT_CONTENTS_SCHEMA,
  format: 'galicia-visa',
  number: '1',
  previous_closed_on: '2026-07-20',
  closed_on: '2026-08-20',
  due_on: '2026-08-30',
  previous_ars_cents: 0,
  previous_usd_cents: 0,
  pending_ars_cents: 0,
  pending_usd_cents: 0,
  minimum_ars_cents: null,
  total_ars_cents: 3000,
  total_usd_cents: 0,
  usd_rate: null,
  lines: [line('A'), line('B'), line('C', true)],
};

describe('withOneOff', () => {
  it('marks the line it names and leaves every other one alone', () => {
    expect(withOneOff(contents, 1).lines.map((l) => l.one_off)).toEqual([false, true, true]);
  });

  it('unmarks a line that was already puntual', () => {
    expect(withOneOff(contents, 2).lines.map((l) => l.one_off)).toEqual([false, false, false]);
  });

  it('leaves the contents it was given untouched, so marks can be chained', () => {
    const once = withOneOff(contents, 0);
    const twice = withOneOff(once, 1);
    expect(contents.lines.map((l) => l.one_off)).toEqual([false, false, true]);
    expect(twice.lines.map((l) => l.one_off)).toEqual([true, true, true]);
  });
});

describe('purchaseKey', () => {
  const installment = (number: number, ars_cents: number): StatementLine => ({
    ...line('MUEBLERIA NORTE'),
    ars_cents,
    installment: { number, of: 6 },
  });

  it('is the same for every installment of one purchase, the first rounded', () => {
    // The bank puts the odd cents of the division on the first installment.
    expect(purchaseKey(installment(1, 988_985))).toBe(purchaseKey(installment(4, 988_983)));
  });

  it('tells apart two purchases of the same day and merchant', () => {
    expect(purchaseKey(installment(1, 3_825_996))).not.toBe(purchaseKey(installment(1, 719_045)));
  });

  it('tells apart two plans of a different length', () => {
    const short = { ...installment(1, 988_985), installment: { number: 1, of: 3 } };
    expect(purchaseKey(short)).not.toBe(purchaseKey(installment(1, 988_985)));
  });
});
