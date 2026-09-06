// =============================================================================
// The Galicia MASTERCARD layout: the totals and the bank's charges come first
// in a consolidated block, then the purchases — the account holder's, closed
// by a SUBTOTAL, then each additional card's, closed by a "TOTAL ADICIONAL DE
// <holder>"; each total is only checked against, who made a purchase is not
// kept. An installment is a "3/6" set off from the merchant as a field of its
// own; a "07/26" a merchant writes on to its own name is a period.
// =============================================================================
import { STATEMENT_CONTENTS_SCHEMA } from '../statement';
import {
  StatementError,
  UnknownLayout,
  type PageLine,
  type StatementContents,
  type StatementLine,
} from '../statement';
import {
  amounts,
  headerDates,
  installment,
  isoFromNamedDate,
  minimumPayment,
  reconcile,
  statementNumber,
  sum,
  text,
  usdRate,
} from './common';

const SIGNATURE = /^Tarjeta Crédito MASTERCARD/;
/** The receipt-number column: a purchase's five digits sit here. */
const RECEIPT_MIN_X0 = 320;
const RECEIPT_MAX_X0 = 440;
const ADDITIONAL_TOTAL = /^TOTAL ADICIONAL DE .+? [\d.]+,\d\d [\d.]+,\d\d$/;
/** An installment is printed as a field of its own, this far or further from
 *  the word before it; a period a merchant prints in its own name sits one
 *  space (about 9) from it. Under "CUOTA DEL MES" every token is an
 *  installment, wherever it sits; under "COMPRAS DEL MES" both are found. */
const INSTALLMENT_MIN_GAP = 18;

export function parseGaliciaMastercard(pages: PageLine[][]): StatementContents {
  const lines = pages.flat();
  if (!lines.some((line) => SIGNATURE.test(text(line)))) throw new UnknownLayout();

  const purchases: StatementLine[] = [];
  const charges: StatementLine[] = [];
  let block: StatementLine[] = [];
  let previous = { ars: 0, usd: 0 };
  let pending = { ars: 0, usd: 0 };
  let consumption: { ars: number; usd: number } | null = null;
  let total: { ars: number; usd: number } | null = null;
  let inDetail = false;
  let inCharges = false;
  let inInstallments = false;

  for (const line of lines) {
    const t = text(line);
    if (t === 'DETALLE DEL CONSUMO') {
      inDetail = true;
      inCharges = false;
      continue;
    }
    if (t === 'CUOTA DEL MES' || t === 'COMPRAS DEL MES') {
      inInstallments = t === 'CUOTA DEL MES';
      continue;
    }
    if (!inDetail) {
      const { ars, usd, rest } = amounts(line);
      if (t.startsWith('SALDO ANTERIOR')) previous = { ars: ars ?? 0, usd: usd ?? 0 };
      else if (t.startsWith('SALDO PENDIENTE')) pending = { ars: ars ?? 0, usd: usd ?? 0 };
      else if (t.startsWith('TOTAL CONSUMOS DEL MES')) {
        consumption = { ars: ars ?? 0, usd: usd ?? 0 };
      } else if (t.startsWith('SUBTOTAL')) inCharges = true;
      else if (t.startsWith('TOTAL A PAGAR')) {
        total = { ars: ars ?? 0, usd: usd ?? 0 };
        inCharges = false;
      } else if (inCharges && (ars !== null || usd !== null)) {
        charges.push({
          on: '',
          description: rest.map((w) => w.text).join(' '),
          installment: null,
          ars_cents: ars ?? 0,
          usd_cents: usd ?? 0,
          charge: true,
          one_off: false,
        });
      }
      continue;
    }
    const additional = ADDITIONAL_TOTAL.test(t);
    if (t.startsWith('SUBTOTAL') || additional) {
      const { ars, usd } = amounts(line);
      const card = additional ? 'un adicional' : 'el titular';
      reconcile(`Los consumos de ${card}`, sum(block, 'ars_cents'), ars ?? 0, '$');
      reconcile(`Los consumos en dólares de ${card}`, sum(block, 'usd_cents'), usd ?? 0, 'US$');
      purchases.push(...block);
      block = [];
      inInstallments = false;
      continue;
    }
    const on = isoFromNamedDate(line[0].text);
    if (!on) continue;
    const { ars, usd, rest } = amounts(line);
    const body = rest.slice(1);
    const receipt = body.find(
      (w) => w.x0 >= RECEIPT_MIN_X0 && w.x0 < RECEIPT_MAX_X0 && /^\d{5}$/.test(w.text),
    );
    const paid = body.find(
      (w, i) =>
        w.x0 < RECEIPT_MIN_X0 &&
        installment(w.text) !== null &&
        (inInstallments || (i > 0 && w.x0 - body[i - 1].x1 >= INSTALLMENT_MIN_GAP)),
    );
    block.push({
      on,
      description: body
        .filter((w) => w !== receipt && w !== paid)
        .map((w) => w.text)
        .join(' '),
      installment: paid ? installment(paid.text) : null,
      ars_cents: ars ?? 0,
      usd_cents: usd ?? 0,
      charge: false,
      one_off: false,
    });
  }

  if (total === null || consumption === null) {
    throw new StatementError('No se encontraron los totales del resumen; no se guardó nada.');
  }
  const dates = headerDates(lines);
  if (!dates) throw new StatementError('No se encontró la fecha de cierre; no se guardó nada.');
  reconcile('Los consumos', sum(purchases, 'ars_cents'), consumption.ars, '$');
  reconcile('Los consumos en dólares', sum(purchases, 'usd_cents'), consumption.usd, 'US$');
  // The bank dates its charges the closing day; the block does not say so.
  for (const charge of charges) charge.on = dates.closed_on;
  const all = [...purchases, ...charges];
  reconcile('Los movimientos', sum(all, 'ars_cents') + pending.ars, total.ars, '$');
  reconcile('Los movimientos en dólares', sum(all, 'usd_cents') + pending.usd, total.usd, 'US$');

  return {
    schema: STATEMENT_CONTENTS_SCHEMA,
    format: 'galicia-mastercard',
    number: statementNumber(lines) ?? '',
    ...dates,
    previous_ars_cents: previous.ars,
    previous_usd_cents: previous.usd,
    pending_ars_cents: pending.ars,
    pending_usd_cents: pending.usd,
    minimum_ars_cents: minimumPayment(lines),
    total_ars_cents: total.ars,
    total_usd_cents: total.usd,
    usd_rate: usdRate(charges, purchases),
    lines: all,
  };
}
