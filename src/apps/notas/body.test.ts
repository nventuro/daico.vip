import { describe, it, expect } from 'vitest';
import { NOTE_BODY_SCHEMA, openBody, sealBody } from './body';
import { gzip } from '../../lib/compress';
import { encryptFile, toBase64 } from '../../lib/householdKey';

const masterKey = () =>
  crypto.subtle.generateKey({ name: 'AES-KW', length: 256 }, false, ['wrapKey', 'unwrapKey']);

const body = `# La nota

Con **markdown**, un :spoiler[secreto] y acentos: ñoquis, camión.`;

/** A body sealed under `schema`, the way a version that knew it would write it. */
async function sealedUnder(key: CryptoKey, schema: number, text: string) {
  const packed = await gzip(new TextEncoder().encode(JSON.stringify({ schema, text })));
  const { data, wrappedFileKey } = await encryptFile(key, packed);
  return { body: toBase64(data), wrapped_key: wrappedFileKey };
}

describe('a note body', () => {
  it('comes back whole', async () => {
    const key = await masterKey();
    expect(await openBody(key, await sealBody(key, body))).toBe(body);
  });

  it('seals an empty note too, so no row ever carries one in the clear', async () => {
    const key = await masterKey();
    const sealed = await sealBody(key, '');
    expect(sealed.body).not.toBe('');
    expect(await openBody(key, sealed)).toBe('');
  });

  it('does not open under another key', async () => {
    const sealed = await sealBody(await masterKey(), body);
    await expect(openBody(await masterKey(), sealed)).rejects.toThrow();
  });

  it('refuses one sealed by a newer version instead of reading it short', async () => {
    const key = await masterKey();
    const ahead = await sealedUnder(key, NOTE_BODY_SCHEMA + 1, body);
    await expect(openBody(key, ahead)).rejects.toThrow('más nueva');
  });
});
