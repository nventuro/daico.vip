// =============================================================================
// The Galicia VISA layout: the previous balance and the account's own
// movements against it (a payment, the dollar balance carried into pesos);
// then, under DETALLE DEL CONSUMO, purchases listed card by card, each card
// closed by a "TARJETA NNNN Total Consumos de <holder>" total, which is only
// checked against — who made a purchase is not kept; then the bank's own
// charges, then TOTAL A PAGAR. Every purchase carries a six-digit receipt
// number in a column of its own, which is what tells it from a charge. No
// pending balance is printed: it is what the previous balance and the
// movements against it come to.
// =============================================================================
import { STATEMENT_CONTENTS_SCHEMA } from '../../../types';
import {
  StatementError,
  UnknownLayout,
  type PageLine,
  type StatementContents,
  type StatementLine,
} from '../statement';
import {
  amounts,
  cents,
  headerDates,
  installment,
  isoFromNumericDate,
  minimumPayment,
  reconcile,
  statementNumber,
  text,
  usdRate,
} from './common';

const SIGNATURE = /^Tarjeta Crédito VISA/;
/** A one-letter mark the bank prints left of some descriptions. */
const FLAG_MAX_X0 = 84;
/** The installment column. */
const INSTALLMENT_MIN_X0 = 318;
const INSTALLMENT_MAX_X0 = 360;
/** The receipt-number column. */
const RECEIPT_MIN_X0 = 352;
const RECEIPT_MAX_X0 = 440;
const CARD_TOTAL = /^TARJETA (\d{4}) Total Consumos de (.+?) ([\d.]+,\d\d) ([\d.]+,\d\d)$/;

export function parseGaliciaVisa(pages: PageLine[][]): StatementContents {
  const lines = pages.flat();
  if (!lines.some((line) => SIGNATURE.test(text(line)))) throw new UnknownLayout();

  let cards = 0;
  const purchases: StatementLine[] = [];
  const charges: StatementLine[] = [];
  let block: StatementLine[] = [];
  let previous = { ars: 0, usd: 0 };
  let carried = { ars: 0, usd: 0 };
  let total: { ars: number; usd: number } | null = null;
  let inDetail = false;

  for (const line of lines) {
    const t = text(line);
    if (t === 'DETALLE DEL CONSUMO') {
      inDetail = true;
      continue;
    }
    const cardTotal = CARD_TOTAL.exec(t);
    if (cardTotal) {
      const card = `la tarjeta …${cardTotal[1]}`;
      reconcile(`Los consumos de ${card}`, sum(block, 'ars_cents'), cents(cardTotal[3]) ?? 0, '$');
      reconcile(
        `Los consumos en dólares de ${card}`,
        sum(block, 'usd_cents'),
        cents(cardTotal[4]) ?? 0,
        'US$',
      );
      purchases.push(...block);
      cards++;
      block = [];
      continue;
    }
    if (t.startsWith('SALDO ANTERIOR')) {
      const { ars, usd } = amounts(line);
      previous = { ars: ars ?? 0, usd: usd ?? 0 };
      continue;
    }
    if (t.startsWith('TOTAL A PAGAR')) {
      const { ars, usd } = amounts(line);
      total = { ars: ars ?? 0, usd: usd ?? 0 };
      continue;
    }
    const on = isoFromNumericDate(line[0].text);
    if (!on) continue;
    const { ars, usd, rest } = amounts(line);
    if (!inDetail) {
      carried = { ars: carried.ars + (ars ?? 0), usd: carried.usd + (usd ?? 0) };
      continue;
    }
    const words = rest.slice(1);
    const flagged = words.length > 0 && words[0].x0 < FLAG_MAX_X0 && words[0].text.length === 1;
    const body = flagged ? words.slice(1) : words;
    const receipt = body.find(
      (w) => w.x0 >= RECEIPT_MIN_X0 && w.x0 < RECEIPT_MAX_X0 && /^\d{6}$/.test(w.text),
    );
    const paid = body.find(
      (w) => w.x0 >= INSTALLMENT_MIN_X0 && w.x0 < INSTALLMENT_MAX_X0 && installment(w.text),
    );
    const movement: StatementLine = {
      on,
      description: body
        .filter((w) => w !== receipt && w !== paid)
        .map((w) => w.text)
        .join(' '),
      installment: paid ? installment(paid.text) : null,
      ars_cents: ars ?? 0,
      usd_cents: usd ?? 0,
      charge: !receipt,
      one_off: false,
    };
    if (receipt) block.push(movement);
    else charges.push(movement);
  }

  if (cards === 0 || total === null) {
    throw new StatementError('No se encontraron los totales del resumen; no se guardó nada.');
  }
  const dates = headerDates(lines);
  if (!dates) throw new StatementError('No se encontró la fecha de cierre; no se guardó nada.');
  const pending = { ars: previous.ars + carried.ars, usd: previous.usd + carried.usd };
  const all = [...purchases, ...charges];
  reconcile('Los movimientos', sum(all, 'ars_cents') + pending.ars, total.ars, '$');
  reconcile('Los movimientos en dólares', sum(all, 'usd_cents') + pending.usd, total.usd, 'US$');

  return {
    schema: STATEMENT_CONTENTS_SCHEMA,
    format: 'galicia-visa',
    number: statementNumber(lines) ?? '',
    ...dates,
    previous_ars_cents: previous.ars,
    previous_usd_cents: previous.usd,
    pending_ars_cents: pending.ars,
    pending_usd_cents: pending.usd,
    minimum_ars_cents: minimumPayment(lines),
    total_ars_cents: total.ars,
    total_usd_cents: total.usd,
    usd_rate: usdRate(charges, total.usd),
    lines: all,
  };
}

function sum(lines: StatementLine[], key: 'ars_cents' | 'usd_cents'): number {
  return lines.reduce((acc, line) => acc + line[key], 0);
}
