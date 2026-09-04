// =============================================================================
// Sealing a PDF for the household. The worker holds nothing that opens a file:
// it encrypts each PDF under a fresh key of its own and wraps that key under
// the household's inbox public key, which only the private half — sealed on
// the server under the master key — can undo. Nothing here is ever decrypted.
//
// The layout is the worker's own copy of the app's attachment file format,
// written so that once the app re-wraps the file key under the master key the
// sealed bytes are an ordinary attachment, untouched. A test on the app side
// opens what this produces, which is what keeps the two copies in step.
// =============================================================================
import { fromBase64, toBase64 } from './base64';

/** First byte of a sealed file, so the layout can change later. */
const FILE_FORMAT_VERSION = 1;
const NONCE_BYTES = 12;
const FILE_KEY_BITS = 256;

/** A sealed PDF and the wrapped key that opens it, as stored. */
export interface SealedFile {
  data: Uint8Array;
  /** Base64: the file key under the inbox public key. */
  wrappedKey: string;
}

/** The household's inbox public key, from the base64 SPKI the app published. */
export async function importInboxPublicKey(spki: string): Promise<CryptoKey> {
  return crypto.subtle.importKey(
    'spki',
    fromBase64(spki),
    { name: 'RSA-OAEP', hash: 'SHA-256' },
    false,
    ['wrapKey'],
  );
}

/** `bytes` sealed under a fresh key of their own, that key wrapped under
 *  `publicKey`. Every call seals afresh: two seals of one PDF never share a
 *  key or a nonce. */
export async function sealPdf(publicKey: CryptoKey, bytes: Uint8Array): Promise<SealedFile> {
  // A symmetric algorithm yields one key, which the runtime's types do not
  // say on their own.
  const fileKey = (await crypto.subtle.generateKey(
    { name: 'AES-GCM', length: FILE_KEY_BITS },
    true,
    ['encrypt'],
  )) as CryptoKey;
  const nonce = crypto.getRandomValues(new Uint8Array(NONCE_BYTES));
  // A buffer of the bytes' own, the one form every runtime's types agree on.
  const plain = bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength);
  const cipher = new Uint8Array(
    await crypto.subtle.encrypt({ name: 'AES-GCM', iv: nonce }, fileKey, plain as ArrayBuffer),
  );
  const data = new Uint8Array(1 + NONCE_BYTES + cipher.length);
  data[0] = FILE_FORMAT_VERSION;
  data.set(nonce, 1);
  data.set(cipher, 1 + NONCE_BYTES);
  const wrappedKey = toBase64(
    new Uint8Array(await crypto.subtle.wrapKey('raw', fileKey, publicKey, { name: 'RSA-OAEP' })),
  );
  return { data, wrappedKey };
}
