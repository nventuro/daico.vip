import { describe, it, expect } from 'vitest';
import { NOTE_BODY_SCHEMA, openBody, sealBody } from './body';
import { gzip } from '../../lib/compress';
import { encryptFile, rowBinding, toBase64 } from '../../lib/householdKey';

const masterKey = () =>
  crypto.subtle.generateKey({ name: 'AES-KW', length: 256 }, false, ['wrapKey', 'unwrapKey']);

const body = `# La nota

Con **markdown**, un :spoiler[secreto] y acentos: ñoquis, camión.`;

/** A body sealed under `schema` for the note `id`, the way a version that
 *  knew it would write it. */
async function sealedUnder(key: CryptoKey, schema: number, text: string, id: string) {
  const packed = await gzip(new TextEncoder().encode(JSON.stringify({ schema, text })));
  const { data, wrappedFileKey } = await encryptFile(key, packed, rowBinding('notes', id));
  return { id, body: toBase64(data), wrapped_key: wrappedFileKey };
}

/** The sealed columns as the note `id` carries them. */
const noteOf = (id: string, sealed: { body: string; wrapped_key: string }) => ({ id, ...sealed });

describe('a note body', () => {
  it('comes back whole', async () => {
    const key = await masterKey();
    expect(await openBody(key, noteOf('n1', await sealBody(key, body, 'n1')))).toBe(body);
  });

  it('seals an empty note too, so no row ever carries one in the clear', async () => {
    const key = await masterKey();
    const sealed = await sealBody(key, '', 'n1');
    expect(sealed.body).not.toBe('');
    expect(await openBody(key, noteOf('n1', sealed))).toBe('');
  });

  it('does not open under another key, nor as another note', async () => {
    const key = await masterKey();
    const sealed = await sealBody(key, body, 'n1');
    await expect(openBody(await masterKey(), noteOf('n1', sealed))).rejects.toThrow();
    await expect(openBody(key, noteOf('n2', sealed))).rejects.toThrow();
  });

  it('refuses one sealed by a newer version instead of reading it short', async () => {
    const key = await masterKey();
    const ahead = await sealedUnder(key, NOTE_BODY_SCHEMA + 1, body, 'n1');
    await expect(openBody(key, ahead)).rejects.toThrow('más nueva');
  });
});
