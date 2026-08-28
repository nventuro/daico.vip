import { describe, it, expect } from 'vitest';
import type { PageLine } from '../statement';
import { StatementError } from '../statement';
import { parseStatement } from './index';
import { parseGaliciaMastercard } from './galiciaMastercard';
import { ars, date, header, usd, w, words } from './fixture';

const receipt = (text: string) => w(text, 363, 387);

function pages(consumption = '320,00'): PageLine[][] {
  return [
    [
      ...header('MASTERCARD BLACK', '027', 'APELLIDO,NOMBRE CONSUMIDOR FINAL'),
      [...words('SALDO ANTERIOR', 80), ars('1.266.276,26'), usd('47,50')],
      [
        date('13-Jul-26'),
        ...words('SU PAGO', 80),
        w('-1.245.058,01', 334, 387),
        ars('-1.245.058,01'),
      ],
      [...words('SALDO PENDIENTE', 80), ars('0,00'), usd('0,00')],
      [...words('TOTAL CONSUMOS DEL MES', 80), ars(consumption), usd('2,49')],
      [w('SUBTOTAL', 23, 67), ars(consumption), usd('2,49')],
      [...words('PERCEPCION IVA DTO 354/18', 80), ars('10,00')],
      [...words('PERCEP.AFIP RG 4815 30%', 80), ars('1.117,51')],
      [...words('TOTAL A PAGAR', 38), ars('1.447,51'), usd('2,49')],
      words('DETALLE DEL CONSUMO', 23),
      [...words('FECHA REFERENCIA', 23), w('COMPROBANTE', 328, 392), w('PESOS', 469, 495)],
      words('COMPRAS DEL MES', 23),
      [
        date('29-Jul-26'),
        ...words('ZANDOR *Play (USA,USD, 2,49)', 80),
        receipt('00163'),
        usd('2,49'),
      ],
      [
        date('06-Jul-26'),
        w('MERPAGO*MELI', 80, 142),
        w('07/26', 151, 173),
        receipt('00563'),
        ars('100,00'),
      ],
      words('CUOTA DEL MES', 23),
      [
        date('07-May-26'),
        w('MERPAGO*TV', 80, 188),
        w('03/06', 217, 240),
        receipt('02216'),
        ars('20,00'),
      ],
      [w('SUBTOTAL', 23, 67), ars('120,00'), usd('2,49')],
    ],
    [
      words('COMPRAS DEL MES', 23),
      [
        date('04-Jul-26'),
        ...words('VETERINARIA X', 80),
        w('01/02', 201, 222),
        receipt('07715'),
        ars('200,00'),
      ],
      [...words('TOTAL ADICIONAL DE OTRO,TITULAR', 23), ars('200,00'), usd('0,00')],
      [...words('TOTAL ADICIONAL DE NADIE,NADA', 23), ars('0,00'), usd('0,00')],
      [...words('TOTAL A PAGAR', 40), ars('1.447,51'), usd('2,49')],
      [w('Agosto-26', 33, 75), w('Septiembre-26', 122, 181)],
      [w('$', 19, 26), w('187.352,78', 35, 88), w('$', 117, 123), w('11.973,12', 137, 181)],
    ],
  ];
}

describe('the Galicia MASTERCARD layout', () => {
  const contents = parseGaliciaMastercard(pages());

  it('reads the consolidated block: totals, previous balance, nothing pending', () => {
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
    expect(JSON.stringify(contents)).not.toMatch(/APELLIDO|NOMBRE|OTRO|TITULAR/);
  });

  it('reads installments beside the merchant and leaves a period alone', () => {
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

  it("reads the bank's charges from the block, dated the closing day", () => {
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

  it('is what parseStatement picks for these pages', () => {
    expect(parseStatement(pages()).format).toBe('galicia-mastercard');
  });
});
