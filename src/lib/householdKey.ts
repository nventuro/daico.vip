// =============================================================================
// The household's key hierarchy, all in WebCrypto:
//
//   phrase ──PBKDF2──▶ phrase key ──AES-KW──▶ master key ──AES-KW──▶ file key
//                                                                      │
//                                                          AES-GCM ──▶ file
//
// Only the phrase lives outside the system, on paper. The server holds the
// master key wrapped under the phrase key and every file key wrapped under the
// master key: ciphertext all the way down, useless without the phrase. A device
// that has unwrapped the master key keeps it non-extractable, so page code can
// use it but never read its bytes.
//
// The master key is a level of its own so the phrase is only ever used to
// unwrap it — what a device keeps is the key, never the phrase — and each file
// has a key of its own so a GCM nonce is never reused and a file can one day
// be shared on its own. Every sealed thing is bound to the row that carries
// it: sealing takes the row's name as associated data, so a blob and its key
// moved to another row open nowhere but under the row they were sealed for.
//
// One branch hangs off it for what arrives sealed from outside: the inbox
// key, a pair whose public half is published for the email worker to seal a
// PDF to, and whose private half is sealed under the master key like any
// file. A file sealed that way is opened here once, at confirm, to be sealed
// again as the attachment it becomes.
// =============================================================================
import { normalize } from '../utils/textUtils';
import { PHRASE_WORDS } from './phraseWords';

/** Words in the household phrase. */
export const HOUSEHOLD_PHRASE_WORDS = 6;

/** PBKDF2 rounds a phrase goes through to derive the key that wraps the master key. */
const HOUSEHOLD_KEY_KDF_ITERATIONS = 600_000;

const SALT_BYTES = 16;
const NONCE_BYTES = 12;
/** First byte of an encrypted file, so the layout can change later. Under
 *  this version what the file is sealed for is bound into it. */
const FILE_FORMAT_VERSION = 2;
/** The version before rows were bound in; a file sealed under it still opens. */
const UNBOUND_FILE_FORMAT_VERSION = 1;

/**
 * What a sealed thing is bound to: the row that carries it, as `table/id`.
 * The same row, and nothing else, opens it.
 */
export function rowBinding(table: string, id: string): string {
  return `${table}/${id}`;
}

/** What the inbox key's private half is bound to: the household has one. */
export const INBOX_KEY_BINDING = 'inbox_key';

const WORD_BY_NORMALIZED = new Map(PHRASE_WORDS.map((word) => [normalize(word), word]));

/** The derivation parameters and wrapped master key, as stored. */
export interface WrappedMasterKey {
  kdf: 'pbkdf2-sha256';
  /** Base64. */
  salt: string;
  iterations: number;
  /** Base64. */
  wrapped_master_key: string;
}

/** An encrypted file and the wrapped key that opens it, as stored. */
export interface EncryptedFile {
  data: Uint8Array<ArrayBuffer>;
  /** Base64. */
  wrappedFileKey: string;
}

// Spread in slices: a whole file's worth of arguments overruns the call stack.
const BASE64_CHUNK = 0x8000;

/** Bytes as base64 text, the form a text column carries them in. */
export function toBase64(bytes: Uint8Array): string {
  let binary = '';
  for (let i = 0; i < bytes.length; i += BASE64_CHUNK) {
    binary += String.fromCharCode(...bytes.subarray(i, i + BASE64_CHUNK));
  }
  return btoa(binary);
}

/** The bytes a base64 text stands for. */
export function fromBase64(text: string): Uint8Array<ArrayBuffer> {
  const binary = atob(text);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes;
}

/** The bytes of a view as a buffer of their own, the form WebCrypto takes. */
function buffer(view: Uint8Array): ArrayBuffer {
  return view.buffer.slice(view.byteOffset, view.byteOffset + view.byteLength) as ArrayBuffer;
}

// ─── The phrase ──────────────────────────────────────────────────────────────

/** A fresh phrase: words drawn uniformly at random from the list. */
export function generatePhrase(): string[] {
  // 2048 divides 65536, so the modulo keeps the draw uniform.
  const draws = crypto.getRandomValues(new Uint16Array(HOUSEHOLD_PHRASE_WORDS));
  return Array.from(draws, (n) => PHRASE_WORDS[n % PHRASE_WORDS.length]);
}

/** Whether `word`, however accented or cased, is a word of the list. */
export function isPhraseWord(word: string): boolean {
  return WORD_BY_NORMALIZED.has(normalize(word.trim()));
}

/**
 * The words of a typed phrase as they appear in the list, ignoring case,
 * accents and spacing; null when the count is off or a word is not in the
 * list, which a phrase written down from the list can never be.
 */
export function parsePhrase(words: string[]): string[] | null {
  const canonical = words
    .flatMap((w) => w.trim().split(/\s+/))
    .filter(Boolean)
    .map((w) => WORD_BY_NORMALIZED.get(normalize(w)));
  if (canonical.length !== HOUSEHOLD_PHRASE_WORDS) return null;
  return canonical.every((w) => w !== undefined) ? canonical : null;
}

async function phraseKey(
  words: string[],
  salt: Uint8Array<ArrayBuffer>,
  iterations: number,
): Promise<CryptoKey> {
  const material = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(words.join(' ').normalize('NFKD')),
    'PBKDF2',
    false,
    ['deriveKey'],
  );
  return crypto.subtle.deriveKey(
    { name: 'PBKDF2', hash: 'SHA-256', salt, iterations },
    material,
    { name: 'AES-KW', length: 256 },
    false,
    ['wrapKey', 'unwrapKey'],
  );
}

// ─── The master key ──────────────────────────────────────────────────────────

/**
 * A brand-new master key wrapped under `words`: what the first member stores
 * for the household. The returned key is the non-extractable copy this device
 * keeps.
 */
export async function createMasterKey(
  words: string[],
): Promise<{ key: CryptoKey; wrapped: WrappedMasterKey }> {
  const salt = crypto.getRandomValues(new Uint8Array(SALT_BYTES));
  const kek = await phraseKey(words, salt, HOUSEHOLD_KEY_KDF_ITERATIONS);
  // Generated extractable only so it can be wrapped once; what the device keeps
  // is the non-extractable key that unwrapping yields.
  const fresh = await crypto.subtle.generateKey({ name: 'AES-KW', length: 256 }, true, [
    'wrapKey',
    'unwrapKey',
  ]);
  const wrappedBytes = new Uint8Array(await crypto.subtle.wrapKey('raw', fresh, kek, 'AES-KW'));
  const wrapped: WrappedMasterKey = {
    kdf: 'pbkdf2-sha256',
    salt: toBase64(salt),
    iterations: HOUSEHOLD_KEY_KDF_ITERATIONS,
    wrapped_master_key: toBase64(wrappedBytes),
  };
  const key = await unwrapMasterKey(words, wrapped);
  if (!key) throw new Error('A key just wrapped failed to unwrap');
  return { key, wrapped };
}

/**
 * The master key unwrapped with `words`, non-extractable, or null when the
 * phrase is wrong: AES-KW carries an integrity check, so a wrong phrase is
 * caught on the device without any stored verifier.
 */
export async function unwrapMasterKey(
  words: string[],
  wrapped: WrappedMasterKey,
): Promise<CryptoKey | null> {
  const kek = await phraseKey(words, fromBase64(wrapped.salt), wrapped.iterations);
  try {
    return await crypto.subtle.unwrapKey(
      'raw',
      fromBase64(wrapped.wrapped_master_key),
      kek,
      'AES-KW',
      { name: 'AES-KW', length: 256 },
      false,
      ['wrapKey', 'unwrapKey'],
    );
  } catch {
    return null;
  }
}

// ─── Files ───────────────────────────────────────────────────────────────────

/** `boundTo` as the bytes the cipher binds in. */
function binding(boundTo: string): Uint8Array<ArrayBuffer> {
  return new TextEncoder().encode(boundTo);
}

/**
 * `plain` encrypted under a fresh key of its own, that key wrapped under
 * `masterKey`, bound to `boundTo` — the row that will carry it, from
 * `rowBinding`.
 */
export async function encryptFile(
  masterKey: CryptoKey,
  plain: Uint8Array,
  boundTo: string,
): Promise<EncryptedFile> {
  const fileKey = await crypto.subtle.generateKey({ name: 'AES-GCM', length: 256 }, true, [
    'encrypt',
    'decrypt',
  ]);
  const nonce = crypto.getRandomValues(new Uint8Array(NONCE_BYTES));
  const cipher = new Uint8Array(
    await crypto.subtle.encrypt(
      { name: 'AES-GCM', iv: nonce, additionalData: binding(boundTo) },
      fileKey,
      buffer(plain),
    ),
  );
  const data = new Uint8Array(1 + NONCE_BYTES + cipher.length);
  data[0] = FILE_FORMAT_VERSION;
  data.set(nonce, 1);
  data.set(cipher, 1 + NONCE_BYTES);
  const wrappedFileKey = toBase64(
    new Uint8Array(await crypto.subtle.wrapKey('raw', fileKey, masterKey, 'AES-KW')),
  );
  return { data, wrappedFileKey };
}

/** The contents of a sealed file, opened with its own key. Throws when the
 *  key is not the file's, the data was altered, or the file was sealed for
 *  another row. */
async function openSealed(
  fileKey: CryptoKey,
  data: Uint8Array,
  boundTo: string,
): Promise<Uint8Array<ArrayBuffer>> {
  const version = data[0];
  if (version !== FILE_FORMAT_VERSION && version !== UNBOUND_FILE_FORMAT_VERSION) {
    throw new Error(`Unknown attachment file format ${version}`);
  }
  const nonce = buffer(data.subarray(1, 1 + NONCE_BYTES));
  const cipher = buffer(data.subarray(1 + NONCE_BYTES));
  const params: AesGcmParams =
    version === FILE_FORMAT_VERSION
      ? { name: 'AES-GCM', iv: nonce, additionalData: binding(boundTo) }
      : { name: 'AES-GCM', iv: nonce };
  return new Uint8Array(await crypto.subtle.decrypt(params, fileKey, cipher));
}

/** The contents of an encrypted file bound to `boundTo`. Throws when the key
 *  is not the file's, the data was altered, or the file is another row's. */
export async function decryptFile(
  masterKey: CryptoKey,
  wrappedFileKey: string,
  data: Uint8Array,
  boundTo: string,
): Promise<Uint8Array<ArrayBuffer>> {
  const fileKey = await crypto.subtle.unwrapKey(
    'raw',
    fromBase64(wrappedFileKey),
    masterKey,
    'AES-KW',
    { name: 'AES-GCM', length: 256 },
    false,
    ['decrypt'],
  );
  return openSealed(fileKey, data, boundTo);
}

// ─── The inbox key ───────────────────────────────────────────────────────────

const INBOX_KEY_ALGORITHM = { name: 'RSA-OAEP', hash: 'SHA-256' } as const;
const INBOX_KEY_MODULUS_BITS = 2048;
/** 65537, the usual public exponent, as the bytes WebCrypto takes it in. */
const INBOX_KEY_PUBLIC_EXPONENT = new Uint8Array([1, 0, 1]);

/** The pair as stored: the public half in the clear, the private half sealed. */
export interface InboxKeyPair {
  /** Base64 SPKI. */
  public_key: string;
  /** Base64: PKCS#8, sealed as a file is. */
  private_key: string;
  /** Base64: the key that sealed `private_key`, wrapped under the master key. */
  wrapped_key: string;
}

/** A fresh pair, its private half sealed under `masterKey`. */
export async function createInboxKey(masterKey: CryptoKey): Promise<InboxKeyPair> {
  const pair = await crypto.subtle.generateKey(
    {
      ...INBOX_KEY_ALGORITHM,
      modulusLength: INBOX_KEY_MODULUS_BITS,
      publicExponent: INBOX_KEY_PUBLIC_EXPONENT,
    },
    true,
    ['wrapKey', 'unwrapKey'],
  );
  const spki = new Uint8Array(await crypto.subtle.exportKey('spki', pair.publicKey));
  const pkcs8 = new Uint8Array(await crypto.subtle.exportKey('pkcs8', pair.privateKey));
  const sealed = await encryptFile(masterKey, pkcs8, INBOX_KEY_BINDING);
  return {
    public_key: toBase64(spki),
    private_key: toBase64(sealed.data),
    wrapped_key: sealed.wrappedFileKey,
  };
}

/**
 * The private half opened with `masterKey`: non-extractable, and only ever
 * unwraps a file key. Throws when the master key is not the pair's, and when
 * the public half published beside it is not this key's other half — then
 * whatever the worker sealed to it was sealed for someone else.
 */
export async function openInboxKey(masterKey: CryptoKey, pair: InboxKeyPair): Promise<CryptoKey> {
  const pkcs8 = await decryptFile(
    masterKey,
    pair.wrapped_key,
    fromBase64(pair.private_key),
    INBOX_KEY_BINDING,
  );
  const privateKey = await crypto.subtle.importKey('pkcs8', pkcs8, INBOX_KEY_ALGORITHM, false, [
    'unwrapKey',
  ]);
  // A key wrapped under the public half must come back out under this one:
  // nothing is exported to compare, the pair is simply asked to work.
  try {
    const publicKey = await crypto.subtle.importKey(
      'spki',
      fromBase64(pair.public_key),
      INBOX_KEY_ALGORITHM,
      false,
      ['wrapKey'],
    );
    const probe = await crypto.subtle.generateKey({ name: 'AES-GCM', length: 256 }, true, [
      'encrypt',
    ]);
    const wrapped = await crypto.subtle.wrapKey('raw', probe, publicKey, INBOX_KEY_ALGORITHM.name);
    await crypto.subtle.unwrapKey(
      'raw',
      wrapped,
      privateKey,
      INBOX_KEY_ALGORITHM.name,
      { name: 'AES-GCM', length: 256 },
      false,
      ['encrypt'],
    );
  } catch {
    throw new Error('La clave pública del correo no es la de este par.');
  }
  return privateKey;
}

/**
 * A file sealed outside to the public half, opened: its key unwrapped with
 * `privateKey`, in the clear only for the call, and the bytes opened as any
 * file's are, under `boundTo`. Throws when `wrappedKey` was not wrapped for
 * this pair, or the file is not the row's.
 */
export async function openInboxFile(
  privateKey: CryptoKey,
  wrappedKey: string,
  data: Uint8Array,
  boundTo: string,
): Promise<Uint8Array<ArrayBuffer>> {
  const fileKey = await crypto.subtle.unwrapKey(
    'raw',
    fromBase64(wrappedKey),
    privateKey,
    INBOX_KEY_ALGORITHM.name,
    { name: 'AES-GCM', length: 256 },
    false,
    ['decrypt'],
  );
  return openSealed(fileKey, data, boundTo);
}
