import { describe, it, expect } from 'vitest';
import { StatementError } from '../statement';
import { parseGaliciaVisa } from './galiciaVisa';
import { carried, cardTotal, pages } from './testing/galiciaVisaPages';

describe('the Galicia VISA layout', () => {
  it('reads the header: dates, number, previous balance, minimum, totals', () => {
    const contents = parseGaliciaVisa(pages());
    expect(contents.format).toBe('galicia-visa');
    expect(contents.number).toBe('VI0001');
    expect(contents.previous_closed_on).toBe('2026-07-23');
    expect(contents.closed_on).toBe('2026-08-20');
    expect(contents.due_on).toBe('2026-09-01');
    expect(contents.previous_ars_cents).toBe(100_000);
    expect(contents.previous_usd_cents).toBe(500);
    expect(contents.pending_ars_cents).toBe(0);
    expect(contents.pending_usd_cents).toBe(0);
    expect(contents.minimum_ars_cents).toBe(1_000_000);
    expect(contents.total_ars_cents).toBe(3_735_900);
    expect(contents.total_usd_cents).toBe(199);
  });

  it('reads every movement with its installment and currency, and keeps no name', () => {
    const contents = parseGaliciaVisa(pages());
    const purchases = contents.lines.filter((line) => !line.charge);
    expect(purchases.map((line) => line.description)).toEqual([
      'VET CLINIC',
      'ZANDOR *Play USD 1,99',
      'MERPAGO*SHOP',
      'MERPAGO*SHOP',
    ]);
    expect(purchases[0]).toMatchObject({
      on: '2026-07-14',
      installment: { number: 2, of: 2 },
      ars_cents: 3_647_500,
      usd_cents: 0,
      one_off: false,
    });
    expect(purchases[1]).toMatchObject({ usd_cents: 199, ars_cents: 0, installment: null });
    expect(purchases[3].ars_cents).toBe(-10_000);
    expect(JSON.stringify(contents)).not.toMatch(/TITULAR/);
  });

  it("tells the bank's charges by their missing receipt number", () => {
    const contents = parseGaliciaVisa(pages());
    const charges = contents.lines.filter((line) => line.charge);
    expect(charges.map((line) => [line.description, line.ars_cents])).toEqual([
      ['IIBB PERCEP-CABA 2,00%( 100,00)', 200],
      ['DB.RG 5617 30% ( 2940,00 )', 88_200],
    ]);
  });

  it('tells the dollar rate from the 30% withholding', () => {
    const contents = parseGaliciaVisa(pages());
    expect(contents.usd_rate).toBeCloseTo(1477.39, 1);
  });

  it('carries into the total what the payments left of the previous balance', () => {
    // 1.000 + 7.000 − 7.500 = 500 pesos pending; the dollars were carried.
    const withBalance = parseGaliciaVisa(pages('37.859,00', carried));
    expect(withBalance.pending_ars_cents).toBe(50_000);
    expect(withBalance.pending_usd_cents).toBe(0);
    expect(withBalance.lines.filter((line) => line.charge)).toHaveLength(2);
    expect(() => parseGaliciaVisa(pages('37.359,00', carried))).toThrow(StatementError);
  });

  it('refuses a statement whose lines do not add up to its total', () => {
    expect(() => parseGaliciaVisa(pages('37.360,00'))).toThrow(StatementError);
    expect(() => parseGaliciaVisa(pages('37.360,00'))).toThrow(/suman \$ 37,359\.00.*37,360\.00/);
  });

  it("refuses a card whose purchases do not add up to its total, naming the card's digits", () => {
    const off = pages();
    off[0][off[0].length - 1] = cardTotal('1111', 'TITULAR UNO', '36.476,00', '1,99');
    expect(() => parseGaliciaVisa(off)).toThrow(/tarjeta …1111 suman/);
    expect(() => parseGaliciaVisa(off)).not.toThrow(/TITULAR/);
  });
});
