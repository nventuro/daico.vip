// =============================================================================
// The statements a test works with. Every one of them is invented — nothing
// here comes from a real statement, and nothing here may.
// =============================================================================
import {
  STATEMENT_CONTENTS_SCHEMA,
  type StatementContents,
  type StatementLine,
} from '../statement';

/** One movement, with whatever the test does not care about already filled in. */
export function line(over: Partial<StatementLine> = {}): StatementLine {
  return {
    on: '2026-08-10',
    description: 'X',
    installment: null,
    ars_cents: 0,
    usd_cents: 0,
    charge: false,
    one_off: false,
    ...over,
  };
}

/** A statement's contents, in the shape the app seals and opens them: a VISA
 *  closed on the 20th with nothing on it, dollars at 1500 pesos. */
export function statement(over: Partial<StatementContents> = {}): StatementContents {
  return {
    schema: STATEMENT_CONTENTS_SCHEMA,
    format: 'galicia-visa',
    number: '1',
    previous_closed_on: '2026-07-23',
    closed_on: '2026-08-20',
    due_on: '2026-09-01',
    previous_ars_cents: 0,
    previous_usd_cents: 0,
    pending_ars_cents: 0,
    pending_usd_cents: 0,
    minimum_ars_cents: null,
    total_ars_cents: 0,
    total_usd_cents: 0,
    usd_rate: 1500,
    lines: [],
    ...over,
  };
}
