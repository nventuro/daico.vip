// =============================================================================
// What a note's row carries sealed: its body — JSON, gzipped so the row stays
// small enough to travel with its table, then encrypted under a key of its own
// like an attachment's file, then base64 for the text column.
// =============================================================================
import type { Note } from '../../lib/offline/specs';
import { decryptFile, encryptFile, fromBase64, toBase64 } from '../../lib/householdKey';
import { gunzip, gzip } from '../../lib/compress';

/**
 * The shape of what a body seals, bumped whenever that shape changes. A build
 * that meets a later schema refuses the note rather than reading it as an
 * older one: opening it short and saving it back would reseal the loss under a
 * newer `updated_at` and carry it to every device.
 */
export const NOTE_BODY_SCHEMA = 1;

interface SealedBody {
  schema: number;
  text: string;
}

/** The body and wrapped key that carry `text`, sealed under `masterKey`. */
export async function sealBody(
  masterKey: CryptoKey,
  text: string,
): Promise<Pick<Note, 'body' | 'wrapped_key'>> {
  const sealed: SealedBody = { schema: NOTE_BODY_SCHEMA, text };
  const packed = await gzip(new TextEncoder().encode(JSON.stringify(sealed)));
  const { data, wrappedFileKey } = await encryptFile(masterKey, packed);
  return { body: toBase64(data), wrapped_key: wrappedFileKey };
}

/** What a note's row seals. Throws when `masterKey` is not the household's,
 *  when the body was altered, or when it was sealed by a newer version. */
export async function openBody(
  masterKey: CryptoKey,
  note: Pick<Note, 'body' | 'wrapped_key'>,
): Promise<string> {
  const packed = await decryptFile(masterKey, note.wrapped_key, fromBase64(note.body));
  const plain = await gunzip(packed);
  const sealed = JSON.parse(new TextDecoder().decode(plain)) as SealedBody;
  if (sealed.schema !== NOTE_BODY_SCHEMA)
    throw new Error('Esta nota se guardó con una versión más nueva de la app.');
  return sealed.text;
}
