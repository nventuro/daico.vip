import { describe, it, expect } from 'vitest';
import type { PageLine } from '../statement';
import { StatementError } from '../statement';
import { parseStatement } from './index';
import { parseGaliciaVisa } from './galiciaVisa';
import { ars, date, header, usd, w, words } from './fixture';

const flag = w('*', 74, 78);
const desc = (text: string) => words(text, 86);
const installment = (text: string) => w(text, 325, 348);
const receipt = (text: string) => w(text, 365, 394);
const cardTotal = (last4: string, holder: string, pesos: string, dollars: string): PageLine => [
  ...words(`TARJETA ${last4} Total Consumos de ${holder}`, 23),
  ars(pesos),
  usd(dollars),
];
const paidInFull: PageLine[] = [
  [date('03-08-26'), ...words('SU PAGO EN PESOS', 86), ars('-1.000,00')],
  [date('03-08-26'), ...words('SU PAGO EN USD', 86), usd('-5,00')],
];
/** The dollar balance carried into pesos, then a payment short of the rest. */
const carried: PageLine[] = [
  [
    date('01-08-26'),
    ...words('TRANSFERENCIA DEUDA', 86),
    ...words('5,00 TC1400,000', 213),
    ars('7.000,00'),
    usd('-5,00'),
  ],
  [date('03-08-26'), ...words('SU PAGO EN PESOS', 86), ars('-7.500,00')],
];

function pages(total = '37.359,00', movements: PageLine[] = paidInFull): PageLine[][] {
  return [
    [
      ...header('VISA', 'VI0001', 'TITULAR UNO Responsable no categorizado'),
      [...words('SALDO ANTERIOR', 86), ars('1.000,00'), usd('5,00')],
      ...movements,
      words('DETALLE DEL CONSUMO', 23),
      [
        date('14-07-26'),
        flag,
        ...desc('VET CLINIC'),
        installment('02/02'),
        receipt('005078'),
        ars('36.475,00'),
      ],
      [date('28-07-26'), ...desc('ZANDOR *Play USD 1,99'), receipt('966661'), usd('1,99')],
      cardTotal('1111', 'TITULAR UNO', '36.475,00', '1,99'),
    ],
    [
      [date('03-08-26'), w('K', 74, 78), ...desc('MERPAGO*SHOP'), receipt('941238'), ars('100,00')],
      [
        date('05-08-26'),
        w('K', 74, 78),
        ...desc('MERPAGO*SHOP'),
        receipt('099371'),
        ars('-100,00'),
      ],
      cardTotal('2222', 'TITULAR DOS', '0,00', '0,00'),
      [date('20-08-26'), ...words('IIBB PERCEP-CABA 2,00%( 100,00)', 86), ars('2,00')],
      [date('20-08-26'), ...words('DB.RG 5617 30% ( 2940,00 )', 86), ars('882,00')],
      [...words('TOTAL A PAGAR', 38), ars(total), usd('1,99')],
      // pdf.js hands this row over as one run of text.
      [w('Setiembre/26 Octubre/26', 69, 170)],
      [w('$100,00', 71, 119), w('$50,00', 123, 169)],
      [...words('A partir de', 67), w('Marzo/27', 120, 156), w('$10,00', 165, 207)],
    ],
  ];
}

describe('the Galicia VISA layout', () => {
  const contents = parseGaliciaVisa(pages());

  it('reads the header: dates, number, previous balance, minimum, totals', () => {
    expect(contents.format).toBe('galicia-visa');
    expect(contents.number).toBe('VI0001');
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

  it('reads each card with its holder and totals', () => {
    expect(contents.holders).toEqual([
      { holder: 'TITULAR UNO', last4: '1111', ars_cents: 3_647_500, usd_cents: 199 },
      { holder: 'TITULAR DOS', last4: '2222', ars_cents: 0, usd_cents: 0 },
    ]);
  });

  it('reads every movement, with its holder, installment and currency', () => {
    const purchases = contents.lines.filter((line) => !line.charge);
    expect(purchases.map((line) => line.description)).toEqual([
      'VET CLINIC',
      'ZANDOR *Play USD 1,99',
      'MERPAGO*SHOP',
      'MERPAGO*SHOP',
    ]);
    expect(purchases[0]).toMatchObject({
      on: '2026-07-14',
      holder: 'TITULAR UNO',
      installment: { number: 2, of: 2 },
      ars_cents: 3_647_500,
      usd_cents: 0,
      one_off: false,
    });
    expect(purchases[1]).toMatchObject({ usd_cents: 199, ars_cents: 0, installment: null });
    expect(purchases[2].holder).toBe('TITULAR DOS');
    expect(purchases[3].ars_cents).toBe(-10_000);
  });

  it("tells the bank's charges by their missing receipt number", () => {
    const charges = contents.lines.filter((line) => line.charge);
    expect(charges.map((line) => [line.description, line.ars_cents])).toEqual([
      ['IIBB PERCEP-CABA 2,00%( 100,00)', 200],
      ['DB.RG 5617 30% ( 2940,00 )', 88_200],
    ]);
    expect(charges.every((line) => line.holder === null)).toBe(true);
  });

  it('tells the dollar rate from the 30% withholding', () => {
    expect(contents.usd_rate).toBeCloseTo(1477.39, 1);
  });

  it('reads the installments to come, the onward ones included', () => {
    expect(contents.installments_due).toEqual([
      { month: '2026-09', ars_cents: 10_000, onward: false },
      { month: '2026-10', ars_cents: 5_000, onward: false },
      { month: '2027-03', ars_cents: 1_000, onward: true },
    ]);
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
    expect(() => parseGaliciaVisa(pages('37.360,00'))).toThrow(/suman \$ 37\.359,00.*37\.360,00/);
  });

  it('is what parseStatement picks for these pages', () => {
    expect(parseStatement(pages()).format).toBe('galicia-visa');
  });

  it('is refused, with the rest, for pages of no known layout', () => {
    expect(() => parseStatement([[words('Hola', 20)]])).toThrow(/No parece un resumen/);
  });
});
