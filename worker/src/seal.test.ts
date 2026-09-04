import { describe, it, expect } from 'vitest';
import { fromBase64, toBase64 } from './base64';
import { importInboxPublicKey, sealPdf } from './seal';

const VERSION_BYTE = 1;
const NONCE_BYTES = 12;
const GCM_TAG_BYTES = 16;

/** A household's inbox pair as the app would make one: the public half
 *  published as base64 SPKI, the private half kept to open with. */
async function inboxPair(): Promise<{ spki: string; privateKey: CryptoKey }> {
  // An asymmetric algorithm yields a pair, and an SPKI export bytes; the
  // runtime's types say neither on their own.
  const pair = (await crypto.subtle.generateKey(
    {
      name: 'RSA-OAEP',
      modulusLength: 2048,
      publicExponent: new Uint8Array([1, 0, 1]),
      hash: 'SHA-256',
    },
    true,
    ['wrapKey', 'unwrapKey'],
  )) as CryptoKeyPair;
  const exported = (await crypto.subtle.exportKey('spki', pair.publicKey)) as ArrayBuffer;
  return { spki: toBase64(new Uint8Array(exported)), privateKey: pair.privateKey };
}

/** What the app does with a sealed file, minus the re-wrap: the file key
 *  unwrapped with the private half, the bytes opened with it. */
async function open(
  privateKey: CryptoKey,
  data: Uint8Array,
  wrappedKey: string,
): Promise<Uint8Array> {
  const fileKey = await crypto.subtle.unwrapKey(
    'raw',
    fromBase64(wrappedKey),
    privateKey,
    { name: 'RSA-OAEP' },
    { name: 'AES-GCM', length: 256 },
    false,
    ['decrypt'],
  );
  const nonce = data.subarray(1, 1 + NONCE_BYTES);
  const cipher = data.subarray(1 + NONCE_BYTES);
  return new Uint8Array(
    await crypto.subtle.decrypt({ name: 'AES-GCM', iv: nonce }, fileKey, cipher),
  );
}

const pdf = new TextEncoder().encode('%PDF-1.4 not really a PDF, but bytes all the same');

describe('sealPdf', () => {
  it('writes the version byte, a nonce and the ciphertext, and opens under the private half', async () => {
    const { spki, privateKey } = await inboxPair();
    const { data, wrappedKey } = await sealPdf(await importInboxPublicKey(spki), pdf);
    expect(data[0]).toBe(VERSION_BYTE);
    expect(data.length).toBe(1 + NONCE_BYTES + pdf.length + GCM_TAG_BYTES);
    expect(await open(privateKey, data, wrappedKey)).toEqual(pdf);
  });

  it('seals afresh every time: two seals of one PDF share neither key nor nonce', async () => {
    const { spki } = await inboxPair();
    const publicKey = await importInboxPublicKey(spki);
    const first = await sealPdf(publicKey, pdf);
    const second = await sealPdf(publicKey, pdf);
    expect(first.wrappedKey).not.toBe(second.wrappedKey);
    expect(first.data.subarray(1, 1 + NONCE_BYTES)).not.toEqual(
      second.data.subarray(1, 1 + NONCE_BYTES),
    );
  });

  it('cannot be opened with another household’s private half', async () => {
    const { spki } = await inboxPair();
    const other = await inboxPair();
    const { data, wrappedKey } = await sealPdf(await importInboxPublicKey(spki), pdf);
    await expect(open(other.privateKey, data, wrappedKey)).rejects.toThrow();
  });
});
