import { describe, it, expect } from 'vitest';
import { HOUSEHOLD_PHRASE_WORDS } from './householdKey';
import { PHRASE_WORDS } from './phraseWords';
import {
  createInboxKey,
  createMasterKey,
  decryptFile,
  encryptFile,
  fromBase64,
  generatePhrase,
  isPhraseWord,
  openInboxFile,
  openInboxKey,
  parsePhrase,
  rowBinding,
  toBase64,
  unwrapMasterKey,
} from './householdKey';
// The worker's copy of the file format: what it seals, this file opens.
import { importInboxPublicKey, inboxFileBinding, sealPdf } from '../../worker/src/seal';

const PHRASE = PHRASE_WORDS.slice(0, HOUSEHOLD_PHRASE_WORDS);
const OTHER_PHRASE = PHRASE_WORDS.slice(HOUSEHOLD_PHRASE_WORDS, 2 * HOUSEHOLD_PHRASE_WORDS);

const bytes = (text: string) => new TextEncoder().encode(text);
const text = (data: Uint8Array) => new TextDecoder().decode(data);

/** The row a file under test is sealed for. */
const ROW = rowBinding('attachments', 'a1');

/** A file sealed the way the app did before rows were bound in: version 1,
 *  no associated data. */
async function sealedUnbound(masterKey: CryptoKey, plain: Uint8Array<ArrayBuffer>) {
  const fileKey = await crypto.subtle.generateKey({ name: 'AES-GCM', length: 256 }, true, [
    'encrypt',
  ]);
  const nonce = crypto.getRandomValues(new Uint8Array(12));
  const cipher = new Uint8Array(
    await crypto.subtle.encrypt({ name: 'AES-GCM', iv: nonce }, fileKey, plain),
  );
  const data = new Uint8Array([1, ...nonce, ...cipher]);
  const wrappedFileKey = toBase64(
    new Uint8Array(await crypto.subtle.wrapKey('raw', fileKey, masterKey, 'AES-KW')),
  );
  return { data, wrappedFileKey };
}

describe('the word list', () => {
  it('has 2048 distinct words, none of which is another with accents stripped', () => {
    expect(PHRASE_WORDS).toHaveLength(2048);
    const stripped = PHRASE_WORDS.map((w) => w.normalize('NFD').replace(/\p{M}/gu, ''));
    expect(new Set(stripped).size).toBe(PHRASE_WORDS.length);
  });
});

describe('the phrase', () => {
  it('is drawn from the list, the right number of words long', () => {
    const phrase = generatePhrase();
    expect(phrase).toHaveLength(HOUSEHOLD_PHRASE_WORDS);
    for (const word of phrase) expect(PHRASE_WORDS).toContain(word);
  });

  it('is different every time', () => {
    expect(generatePhrase()).not.toEqual(generatePhrase());
  });

  it('reads typed words back into list words, whatever the case, accents and spacing', () => {
    const [first, second, ...rest] = PHRASE;
    const typed = [
      ` ${first.toUpperCase()} `,
      second.normalize('NFD').replace(/\p{M}/gu, ''),
      rest.slice(0, 2).join('  '),
      ...rest.slice(2),
    ];
    expect(parsePhrase(typed)).toEqual(PHRASE);
  });

  it('rejects a word outside the list, or the wrong number of words', () => {
    expect(parsePhrase([...PHRASE.slice(0, -1), 'daico'])).toBeNull();
    expect(parsePhrase(PHRASE.slice(0, -1))).toBeNull();
    expect(parsePhrase([...PHRASE, PHRASE[0]])).toBeNull();
    expect(isPhraseWord(PHRASE[0].toUpperCase())).toBe(true);
    expect(isPhraseWord('daico')).toBe(false);
  });
});

describe('the master key', () => {
  it('unwraps with the phrase it was wrapped under, and with nothing else', async () => {
    const { key, wrapped } = await createMasterKey(PHRASE);
    expect(key.extractable).toBe(false);
    expect(atob(wrapped.wrapped_master_key)).toHaveLength(40);

    const unwrapped = await unwrapMasterKey(PHRASE, wrapped);
    expect(unwrapped).not.toBeNull();
    // Proof the two are one key: what one seals, the other opens.
    const sealed = await encryptFile(key, bytes('hola'), ROW);
    expect(text(await decryptFile(unwrapped!, sealed.wrappedFileKey, sealed.data, ROW))).toBe(
      'hola',
    );

    expect(await unwrapMasterKey(OTHER_PHRASE, wrapped)).toBeNull();
  });

  it('is wrapped differently every time, even under the same phrase', async () => {
    const a = await createMasterKey(PHRASE);
    const b = await createMasterKey(PHRASE);
    expect(a.wrapped.salt).not.toBe(b.wrapped.salt);
    expect(a.wrapped.wrapped_master_key).not.toBe(b.wrapped.wrapped_master_key);
  });

  it("is derived with the salt and rounds the record carries, not with today's", async () => {
    const { wrapped } = await createMasterKey(PHRASE);
    const otherSalt = toBase64(crypto.getRandomValues(new Uint8Array(16)));
    expect(await unwrapMasterKey(PHRASE, { ...wrapped, salt: otherSalt })).toBeNull();
    expect(
      await unwrapMasterKey(PHRASE, { ...wrapped, iterations: wrapped.iterations - 1 }),
    ).toBeNull();
  });

  it('does not care how the phrase it is given is composed', async () => {
    // An accented word can be typed, pasted or stored either composed or
    // decomposed; the same six words must always reach the same key.
    const { wrapped } = await createMasterKey(PHRASE);
    const composed = PHRASE.map((word) => word.normalize('NFC'));
    expect(composed).not.toEqual(PHRASE);
    expect(await unwrapMasterKey(composed, wrapped)).not.toBeNull();
  });

  it('will not unwrap from an altered record', async () => {
    const { wrapped } = await createMasterKey(PHRASE);
    const altered = fromBase64(wrapped.wrapped_master_key);
    altered[0] ^= 1;
    expect(
      await unwrapMasterKey(PHRASE, { ...wrapped, wrapped_master_key: toBase64(altered) }),
    ).toBeNull();
  });
});

describe('a file', () => {
  it('comes back as it went in', async () => {
    const { key } = await createMasterKey(PHRASE);
    const plain = crypto.getRandomValues(new Uint8Array(60_000));
    const sealed = await encryptFile(key, plain, ROW);
    expect(sealed.data.length).toBe(plain.length + 1 + 12 + 16);
    expect(sealed.data.subarray(29)).not.toEqual(plain);
    expect(await decryptFile(key, sealed.wrappedFileKey, sealed.data, ROW)).toEqual(plain);
  });

  it('gets a key of its own each time', async () => {
    const { key } = await createMasterKey(PHRASE);
    const a = await encryptFile(key, bytes('x'), ROW);
    const b = await encryptFile(key, bytes('x'), ROW);
    expect(a.wrappedFileKey).not.toBe(b.wrappedFileKey);
    expect(a.data).not.toEqual(b.data);
  });

  it('refuses altered data and another household key', async () => {
    const { key } = await createMasterKey(PHRASE);
    const other = (await createMasterKey(OTHER_PHRASE)).key;
    const sealed = await encryptFile(key, bytes('hola'), ROW);
    const altered = sealed.data.slice();
    altered[altered.length - 1] ^= 1;
    await expect(decryptFile(key, sealed.wrappedFileKey, altered, ROW)).rejects.toThrow();
    await expect(decryptFile(other, sealed.wrappedFileKey, sealed.data, ROW)).rejects.toThrow();
  });

  it('opens only under the row it was sealed for', async () => {
    // Whoever can write rows — the server can — could move a blob and its key
    // to another row; bound to its own, it opens nowhere else.
    const { key } = await createMasterKey(PHRASE);
    const sealed = await encryptFile(key, bytes('de un documento'), ROW);
    await expect(
      decryptFile(key, sealed.wrappedFileKey, sealed.data, rowBinding('attachments', 'a2')),
    ).rejects.toThrow();
    await expect(
      decryptFile(key, sealed.wrappedFileKey, sealed.data, rowBinding('notes', 'a1')),
    ).rejects.toThrow();
  });

  it('still opens a file sealed before rows were bound in, under any row', async () => {
    const { key } = await createMasterKey(PHRASE);
    const sealed = await sealedUnbound(key, bytes('de antes'));
    expect(text(await decryptFile(key, sealed.wrappedFileKey, sealed.data, ROW))).toBe('de antes');
    // And seals anew under the current version.
    expect((await encryptFile(key, bytes('x'), ROW)).data[0]).toBe(2);
  });

  it('refuses a change to any part of it: the nonce, the body, or its wrapped key', async () => {
    const { key } = await createMasterKey(PHRASE);
    const sealed = await encryptFile(key, bytes('un documento'), ROW);
    // The nonce sits after the format byte, the body after the nonce.
    for (const at of [1, 12, 13, sealed.data.length - 17]) {
      const altered = sealed.data.slice();
      altered[at] ^= 1;
      await expect(decryptFile(key, sealed.wrappedFileKey, altered, ROW)).rejects.toThrow();
    }
    const wrappedKey = fromBase64(sealed.wrappedFileKey);
    wrappedKey[0] ^= 1;
    await expect(decryptFile(key, toBase64(wrappedKey), sealed.data, ROW)).rejects.toThrow();
  });

  it('refuses a format it does not know, saying which', async () => {
    const { key } = await createMasterKey(PHRASE);
    const sealed = await encryptFile(key, bytes('hola'), ROW);
    for (const version of [0, 3, 255]) {
      const other = sealed.data.slice();
      other[0] = version;
      await expect(decryptFile(key, sealed.wrappedFileKey, other, ROW)).rejects.toThrow(
        `Unknown attachment file format ${version}`,
      );
    }
  });

  it('never seals two files under the same nonce', async () => {
    const { key } = await createMasterKey(PHRASE);
    const sealed = await Promise.all(
      Array.from({ length: 50 }, () => encryptFile(key, bytes('x'), ROW)),
    );
    const nonces = sealed.map((file) => toBase64(file.data.subarray(1, 13)));
    expect(new Set(nonces).size).toBe(nonces.length);
  });
});

describe('base64', () => {
  it('carries bytes past the size it spreads them in', () => {
    // Past what one call to the random generator will fill, let alone one
    // call to the spread that turns the bytes into text.
    const big = new Uint8Array(100_000);
    for (let i = 0; i < big.length; i += 0x10000) {
      crypto.getRandomValues(big.subarray(i, i + 0x10000));
    }
    expect(fromBase64(toBase64(big))).toEqual(big);
    expect(fromBase64(toBase64(new Uint8Array(0)))).toEqual(new Uint8Array(0));
  });
});

describe('the inbox key', () => {
  const STAGED = inboxFileBinding('f1');

  it('opens under its master key, and opens a PDF the worker sealed to it under the row it was staged as', async () => {
    const { key: masterKey } = await createMasterKey(PHRASE);
    const pair = await createInboxKey(masterKey);
    const publicKey = await importInboxPublicKey(pair.public_key);
    const sealed = await sealPdf(publicKey, bytes('%PDF hola'), STAGED);
    const privateKey = await openInboxKey(masterKey, pair);
    expect(text(await openInboxFile(privateKey, sealed.wrappedKey, sealed.data, STAGED))).toBe(
      '%PDF hola',
    );
    // The worker names the row the way the app does; the two copies agree.
    expect(STAGED).toBe(rowBinding('trip_inbox_files', 'f1'));
    await expect(
      openInboxFile(privateKey, sealed.wrappedKey, sealed.data, inboxFileBinding('f2')),
    ).rejects.toThrow();
  });

  it("does not open under another household's master key", async () => {
    const { key: masterKey } = await createMasterKey(PHRASE);
    const { key: other } = await createMasterKey(OTHER_PHRASE);
    const pair = await createInboxKey(masterKey);
    await expect(openInboxKey(other, pair)).rejects.toThrow();
  });

  it("refuses a public half that is not this private half's", async () => {
    // Whoever replaced the published half would have every PDF from then on
    // sealed to a key of their own; the pair is asked to work before it is used.
    const { key: masterKey } = await createMasterKey(PHRASE);
    const pair = await createInboxKey(masterKey);
    const otherPair = await createInboxKey(masterKey);
    await expect(
      openInboxKey(masterKey, { ...pair, public_key: otherPair.public_key }),
    ).rejects.toThrow('no es la de este par');
  });

  it('refuses a file key wrapped for another pair', async () => {
    const { key: masterKey } = await createMasterKey(PHRASE);
    const pair = await createInboxKey(masterKey);
    const otherPair = await createInboxKey(masterKey);
    const publicKey = await importInboxPublicKey(otherPair.public_key);
    const sealed = await sealPdf(publicKey, bytes('x'), STAGED);
    const privateKey = await openInboxKey(masterKey, pair);
    await expect(
      openInboxFile(privateKey, sealed.wrappedKey, sealed.data, STAGED),
    ).rejects.toThrow();
  });

  it('keeps the private half sealed and the public half in the clear', async () => {
    const { key: masterKey } = await createMasterKey(PHRASE);
    const pair = await createInboxKey(masterKey);
    // SPKI, importable as it is; the other two are opaque without the key.
    await expect(importInboxPublicKey(pair.public_key)).resolves.toBeTruthy();
    expect(fromBase64(pair.private_key)[0]).toBe(2);
    expect(pair.wrapped_key).not.toBe('');
  });
});
