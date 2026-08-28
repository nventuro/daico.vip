// =============================================================================
// What the Gastos rows carry sealed: a statement's contents in its payload —
// JSON, gzipped so the row stays a few KB, then encrypted under a key of its
// own like an attachment's file, then base64 for the text column — and a
// merchant rule's pattern, the same way without the compression.
// =============================================================================
import { STATEMENT_CONTENTS_SCHEMA, type MerchantRule, type Statement } from '../../types';
import { decryptFile, encryptFile, fromBase64, toBase64 } from '../../lib/householdKey';
import type { StatementContents, StatementLine } from './statement';

async function through(bytes: Uint8Array<ArrayBuffer>, stream: GenericTransformStream) {
  const piped = new Blob([bytes]).stream().pipeThrough(stream);
  return new Uint8Array(await new Response(piped).arrayBuffer());
}

/** The payload and wrapped key that carry `contents`, sealed under `masterKey`. */
export async function sealContents(
  masterKey: CryptoKey,
  contents: StatementContents,
): Promise<Pick<Statement, 'payload' | 'wrapped_key'>> {
  const plain = new TextEncoder().encode(JSON.stringify(contents));
  const packed = await through(plain, new CompressionStream('gzip'));
  const { data, wrappedFileKey } = await encryptFile(masterKey, packed);
  return { payload: toBase64(data), wrapped_key: wrappedFileKey };
}

/** `record` without `keys`. */
function without(record: Record<string, unknown>, ...keys: string[]): Record<string, unknown> {
  return Object.fromEntries(Object.entries(record).filter(([name]) => !keys.includes(name)));
}

/** `contents` as sealed under an earlier schema, brought to the current
 *  shape: what a later schema dropped is left out, what it added is unknown. */
export function upgradeContents(contents: Record<string, unknown>): StatementContents {
  if (contents.schema === STATEMENT_CONTENTS_SCHEMA)
    return contents as unknown as StatementContents;
  // Schema 1 named who made each purchase, carried the bank's schedule of
  // installments to come, and did not say when the period began.
  const lines = (contents.lines as Record<string, unknown>[]).map((line) =>
    without(line, 'holder'),
  );
  return {
    ...without(contents, 'holders', 'installments_due'),
    schema: STATEMENT_CONTENTS_SCHEMA,
    previous_closed_on: null,
    lines: lines as unknown as StatementLine[],
  } as StatementContents;
}

/** The contents a statement's payload seals, in the current shape whatever
 *  schema they were sealed under. Throws when `masterKey` is not the
 *  household's or the payload was altered. */
export async function openContents(
  masterKey: CryptoKey,
  statement: Pick<Statement, 'payload' | 'wrapped_key'>,
): Promise<StatementContents> {
  const packed = await decryptFile(masterKey, statement.wrapped_key, fromBase64(statement.payload));
  const plain = await through(packed, new DecompressionStream('gzip'));
  return upgradeContents(JSON.parse(new TextDecoder().decode(plain)) as Record<string, unknown>);
}

/** The encrypted pattern and wrapped key that carry `pattern`. */
export async function sealPattern(
  masterKey: CryptoKey,
  pattern: string,
): Promise<Pick<MerchantRule, 'pattern' | 'wrapped_key'>> {
  const { data, wrappedFileKey } = await encryptFile(masterKey, new TextEncoder().encode(pattern));
  return { pattern: toBase64(data), wrapped_key: wrappedFileKey };
}

/** The pattern a rule's row seals. */
export async function openPattern(
  masterKey: CryptoKey,
  rule: Pick<MerchantRule, 'pattern' | 'wrapped_key'>,
): Promise<string> {
  const plain = await decryptFile(masterKey, rule.wrapped_key, fromBase64(rule.pattern));
  return new TextDecoder().decode(plain);
}
