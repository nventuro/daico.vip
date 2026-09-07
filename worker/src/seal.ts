// =============================================================================
// Sealing a file for the household. The worker holds nothing that opens a
// file: it encrypts each under a fresh key of its own and wraps that key under
// the household's inbox public key, which only the private half — sealed on
// the server under the master key — can undo. Nothing here is ever decrypted.
//
// The layout is the worker's own copy of the app's attachment file format,
// bound to the staged file's row the way the app binds a file to its row, so
// the app opens it as it opens any file: the two copies must agree to the
// byte.
// =============================================================================
import { fromBase64, toBase64 } from './base64';

/** First byte of a sealed file, so the layout can change later. */
const FILE_FORMAT_VERSION = 2;
const NONCE_BYTES = 12;
const FILE_KEY_BITS = 256;

/** What a staged file is sealed as: the row of `trip_inbox_files` it is
 *  staged under, named the way the app names a row. */
export function inboxFileBinding(id: string): string {
  return `trip_inbox_files/${id}`;
}

/** A sealed file and the wrapped key that opens it, as stored. */
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
 *  `publicKey`, bound to `boundTo`. Every call seals afresh: two seals of one
 *  file never share a key or a nonce. */
export async function sealFile(
  publicKey: CryptoKey,
  bytes: Uint8Array,
  boundTo: string,
): Promise<SealedFile> {
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
    await crypto.subtle.encrypt(
      { name: 'AES-GCM', iv: nonce, additionalData: new TextEncoder().encode(boundTo) },
      fileKey,
      plain as ArrayBuffer,
    ),
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
