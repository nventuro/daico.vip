import { describe, it, expect } from 'vitest';
import { usdRate } from './common';

const purchase = (usd_cents: number) => ({ usd_cents, charge: false });
const charge = (description: string, ars_cents: number) => ({ description, ars_cents });

describe('usdRate', () => {
  it('values the dollar by the spend the 30% was charged on, not by the net total', () => {
    // A refund of 20 pulls the month's dollar total to 80; the charge was
    // taken on the 100 spent.
    const lines = [purchase(10_000), purchase(-2_000)];
    expect(usdRate([charge('PERCEP.AFIP RG 4815 30%', 30_000_00)], lines)).toBeCloseTo(1000, 6);
  });

  it('reads the base the bank prints beside the charge when it does', () => {
    const lines = [purchase(199)];
    expect(usdRate([charge('DB.RG 5617 30% ( 2940,00 )', 882_00)], lines)).toBeCloseTo(1477.39, 2);
  });

  it('leaves a charge in dollars out of the spend, and is null without a charge or a spend', () => {
    const lines = [purchase(500), { usd_cents: 100, charge: true }];
    expect(usdRate([charge('PERCEP.AFIP RG 4815 30%', 1500_00)], lines)).toBeCloseTo(1000, 6);
    expect(usdRate([], lines)).toBeNull();
    expect(usdRate([charge('PERCEP.AFIP RG 4815 30%', 1500_00)], [purchase(-500)])).toBeNull();
  });
});
