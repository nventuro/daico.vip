// Synthetic pages in the Galicia MASTERCARD layout, for the parser's own test
// and for the one over the layouts together. Nothing here comes from a real
// statement: the holders are invented and the amounts are round, so that is
// plain to see.
import type { PageLine } from '../../statement';
import { ars, date, header, usd, w, words } from './fixture';

const receipt = (text: string) => w(text, 363, 387);

export function pages(consumption = '320,00'): PageLine[][] {
  return [
    [
      ...header('MASTERCARD BLACK', '001', 'APELLIDO,NOMBRE CONSUMIDOR FINAL'),
      [...words('SALDO ANTERIOR', 80), ars('1.000.000,00'), usd('50,00')],
      [
        date('13-Jul-26'),
        ...words('SU PAGO', 80),
        w('-1.000.000,00', 334, 387),
        ars('-1.000.000,00'),
      ],
      [...words('SALDO PENDIENTE', 80), ars('0,00'), usd('0,00')],
      [...words('TOTAL CONSUMOS DEL MES', 80), ars(consumption), usd('2,49')],
      [w('SUBTOTAL', 23, 67), ars(consumption), usd('2,49')],
      [...words('PERCEPCION IVA DTO 354/18', 80), ars('10,00')],
      [...words('PERCEP.AFIP RG 4815 30%', 80), ars('1.120,00')],
      [...words('TOTAL A PAGAR', 38), ars('1.450,00'), usd('2,49')],
      words('DETALLE DEL CONSUMO', 23),
      [...words('FECHA REFERENCIA', 23), w('COMPROBANTE', 328, 392), w('PESOS', 469, 495)],
      words('COMPRAS DEL MES', 23),
      [
        date('29-Jul-26'),
        ...words('ZANDOR *Play (USA,USD, 2,49)', 80),
        receipt('00100'),
        usd('2,49'),
      ],
      [
        date('06-Jul-26'),
        w('MERPAGO*MELI', 80, 142),
        w('07/26', 151, 173),
        receipt('00200'),
        ars('100,00'),
      ],
      words('CUOTA DEL MES', 23),
      [
        date('07-May-26'),
        w('MERPAGO*TV', 80, 188),
        w('03/06', 217, 240),
        receipt('00300'),
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
        receipt('00400'),
        ars('200,00'),
      ],
      [...words('TOTAL ADICIONAL DE OTRO,TITULAR', 23), ars('200,00'), usd('0,00')],
      [...words('TOTAL ADICIONAL DE NADIE,NADA', 23), ars('0,00'), usd('0,00')],
      [...words('TOTAL A PAGAR', 40), ars('1.450,00'), usd('2,49')],
      [w('Agosto-26', 33, 75), w('Septiembre-26', 122, 181)],
      [w('$', 19, 26), w('200.000,00', 35, 88), w('$', 117, 123), w('10.000,00', 137, 181)],
    ],
  ];
}
