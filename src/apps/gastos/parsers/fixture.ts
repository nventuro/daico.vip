// Builders for synthetic statement pages, placed where the bank's layouts
// put each column. Nothing here comes from a real statement.
import type { PageLine, PositionedWord } from '../statement';

/** A word between two page x coordinates. */
export const w = (text: string, x0: number, x1: number): PositionedWord => ({ text, x0, x1 });

/** An amount right-aligned in the pesos column. */
export const ars = (text: string): PositionedWord => w(text, 494 - 4 * text.length, 494);

/** An amount right-aligned in the dollars column. */
export const usd = (text: string): PositionedWord => w(text, 580 - 4 * text.length, 580);

/** A date, first on its line. */
export const date = (text: string): PositionedWord => w(text, 23, 60);

/** A row of words starting at `x0`, each as wide as its text. */
export function words(text: string, x0: number): PositionedWord[] {
  let x = x0;
  return text.split(' ').map((word) => {
    const start = x;
    x += 5 * word.length + 3;
    return w(word, start, x - 3);
  });
}

/** The header lines every page of either layout carries. */
export function header(card: string, number: string, holderLine: string): PageLine[] {
  return [
    [...words('Resumen N°', 76), w(number, 125, 217)],
    words(`Tarjeta Crédito ${card}`, 20),
    [...words(holderLine, 23), ...words('CUIT Banco: 30-1', 300)],
    [
      w('23-Jul-26', 227, 265),
      w('03-Ago-26', 284, 326),
      w('20-Ago-26', 340, 382),
      w('01-Sep-26', 397, 439),
      w('24-Sep-26', 453, 495),
      w('05-Oct-26', 510, 550),
    ],
    [w('PAGO MINIMO', 17, 95), w('LÍMITES', 209, 253)],
    [
      w('$', 34, 40),
      w('10.000,00', 43, 100),
      w('$', 227, 233),
      w('1.000.000,00', 236, 311),
      w('$', 417, 424),
      w('900.000,00', 426, 501),
    ],
  ];
}
