// Synthetic pages in the Galicia VISA layout, for the parser's own test and
// for the one over the layouts together. Nothing here comes from a real
// statement: the holders and the amounts are invented.
import type { PageLine } from '../../statement';
import { ars, date, header, usd, w, words } from './fixture';

const flag = w('*', 74, 78);
const desc = (text: string) => words(text, 86);
const installment = (text: string) => w(text, 325, 348);
const receipt = (text: string) => w(text, 365, 394);
export const cardTotal = (
  last4: string,
  holder: string,
  pesos: string,
  dollars: string,
): PageLine => [
  ...words(`TARJETA ${last4} Total Consumos de ${holder}`, 23),
  ars(pesos),
  usd(dollars),
];
const paidInFull: PageLine[] = [
  [date('03-08-26'), ...words('SU PAGO EN PESOS', 86), ars('-1.000,00')],
  [date('03-08-26'), ...words('SU PAGO EN USD', 86), usd('-5,00')],
];
/** The dollar balance carried into pesos, then a payment short of the rest. */
export const carried: PageLine[] = [
  [
    date('01-08-26'),
    ...words('TRANSFERENCIA DEUDA', 86),
    ...words('5,00 TC1400,000', 213),
    ars('7.000,00'),
    usd('-5,00'),
  ],
  [date('03-08-26'), ...words('SU PAGO EN PESOS', 86), ars('-7.500,00')],
];

export function pages(total = '37.359,00', movements: PageLine[] = paidInFull): PageLine[][] {
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
