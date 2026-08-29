import { describe, it, expect } from 'vitest';
import { purchaseKey, withOneOff, withOneOffsFrom, type StatementLine } from './statement';
import { line, statement } from './testing/contents';

const contents = statement({
  total_ars_cents: 3000,
  lines: [
    line({ description: 'A', ars_cents: 1000 }),
    line({ description: 'B', ars_cents: 1000 }),
    line({ description: 'C', ars_cents: 1000, one_off: true }),
  ],
});

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
  const installment = (number: number, ars_cents: number): StatementLine =>
    line({ description: 'MUEBLERIA NORTE', ars_cents, installment: { number, of: 6 } });

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
