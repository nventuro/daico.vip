import { describe, it, expect } from 'vitest';
import { StatementError, type PageLine } from '../statement';
import { parseGaliciaMastercard } from './galiciaMastercard';
import { pages } from './testing/galiciaMastercardPages';

/** The pages with one token reworded where it stands, so the sums still add up. */
function retokened(from: string, to: string): PageLine[][] {
  return pages().map((page) =>
    page.map((line) => line.map((word) => (word.text === from ? { ...word, text: to } : word))),
  );
}

describe('the Galicia MASTERCARD layout', () => {
  it('reads the consolidated block: totals, previous balance, nothing pending', () => {
    const contents = parseGaliciaMastercard(pages());
    expect(contents.format).toBe('galicia-mastercard');
    expect(contents.number).toBe('027');
    expect(contents.previous_closed_on).toBe('2026-07-23');
    expect(contents.closed_on).toBe('2026-08-20');
    expect(contents.previous_ars_cents).toBe(126_627_626);
    expect(contents.previous_usd_cents).toBe(4_750);
    expect(contents.pending_ars_cents).toBe(0);
    expect(contents.total_ars_cents).toBe(144_751);
    expect(contents.total_usd_cents).toBe(249);
  });

  it('keeps no name: neither the account holder nor an additional card', () => {
    const contents = parseGaliciaMastercard(pages());
    expect(JSON.stringify(contents)).not.toMatch(/APELLIDO|NOMBRE|OTRO|TITULAR/);
  });

  it('reads installments beside the merchant and leaves a period alone', () => {
    const contents = parseGaliciaMastercard(pages());
    const purchases = contents.lines.filter((line) => !line.charge);
    expect(purchases.map((line) => [line.description, line.installment])).toEqual([
      ['ZANDOR *Play (USA,USD, 2,49)', null],
      ['MERPAGO*MELI 07/26', null],
      ['MERPAGO*TV', { number: 3, of: 6 }],
      ['VETERINARIA X', { number: 1, of: 2 }],
    ]);
    expect(purchases[0]).toMatchObject({ usd_cents: 249 });
    expect(purchases[3]).toMatchObject({ on: '2026-07-04' });
  });

  it('tells an installment from a period by how it is set, not by its numbers', () => {
    // A period one space after the merchant is a period whatever it reads as.
    const period = parseGaliciaMastercard(retokened('07/26', '01/24'));
    expect(period.lines.find((line) => line.description.endsWith('01/24'))?.installment).toBeNull();
    // A field set off from the merchant is an installment however long the plan.
    const long = parseGaliciaMastercard(retokened('01/02', '01/30'));
    expect(long.lines.find((line) => line.description === 'VETERINARIA X')?.installment).toEqual({
      number: 1,
      of: 30,
    });
    // Under "CUOTA DEL MES" there is nothing but installments.
    const cuota = parseGaliciaMastercard(retokened('03/06', '03/26'));
    expect(cuota.lines.find((line) => line.description === 'MERPAGO*TV')?.installment).toEqual({
      number: 3,
      of: 26,
    });
  });

  it("reads the bank's charges from the block, dated the closing day", () => {
    const contents = parseGaliciaMastercard(pages());
    const charges = contents.lines.filter((line) => line.charge);
    expect(charges.map((line) => [line.description, line.ars_cents, line.on])).toEqual([
      ['PERCEPCION IVA DTO 354/18', 1_000, '2026-08-20'],
      ['PERCEP.AFIP RG 4815 30%', 111_751, '2026-08-20'],
    ]);
    expect(contents.usd_rate).toBeCloseTo(1496.0, 0);
  });

  it('refuses a statement whose purchases do not add up to its consumption', () => {
    expect(() => parseGaliciaMastercard(pages('321,00'))).toThrow(StatementError);
  });
});
