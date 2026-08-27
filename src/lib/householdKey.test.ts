import { describe, it, expect } from 'vitest';
import { HOUSEHOLD_PHRASE_WORDS } from '../types';
import { PHRASE_WORDS } from './phraseWords';
import {
  createMasterKey,
  decryptFile,
  encryptFile,
  generatePhrase,
  isPhraseWord,
  parsePhrase,
  unwrapMasterKey,
} from './householdKey';

const PHRASE = PHRASE_WORDS.slice(0, HOUSEHOLD_PHRASE_WORDS);
const OTHER_PHRASE = PHRASE_WORDS.slice(HOUSEHOLD_PHRASE_WORDS, 2 * HOUSEHOLD_PHRASE_WORDS);

const bytes = (text: string) => new TextEncoder().encode(text);
const text = (data: Uint8Array) => new TextDecoder().decode(data);

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
    const sealed = await encryptFile(key, bytes('hola'));
    expect(text(await decryptFile(unwrapped!, sealed.wrappedFileKey, sealed.data))).toBe('hola');

    expect(await unwrapMasterKey(OTHER_PHRASE, wrapped)).toBeNull();
  });

  it('is wrapped differently every time, even under the same phrase', async () => {
    const a = await createMasterKey(PHRASE);
    const b = await createMasterKey(PHRASE);
    expect(a.wrapped.salt).not.toBe(b.wrapped.salt);
    expect(a.wrapped.wrapped_master_key).not.toBe(b.wrapped.wrapped_master_key);
  });
});

describe('a file', () => {
  it('comes back as it went in', async () => {
    const { key } = await createMasterKey(PHRASE);
    const plain = crypto.getRandomValues(new Uint8Array(60_000));
    const sealed = await encryptFile(key, plain);
    expect(sealed.data.length).toBe(plain.length + 1 + 12 + 16);
    expect(sealed.data.subarray(29)).not.toEqual(plain);
    expect(await decryptFile(key, sealed.wrappedFileKey, sealed.data)).toEqual(plain);
  });

  it('gets a key of its own each time', async () => {
    const { key } = await createMasterKey(PHRASE);
    const a = await encryptFile(key, bytes('x'));
    const b = await encryptFile(key, bytes('x'));
    expect(a.wrappedFileKey).not.toBe(b.wrappedFileKey);
    expect(a.data).not.toEqual(b.data);
  });

  it('refuses altered data and another household key', async () => {
    const { key } = await createMasterKey(PHRASE);
    const other = (await createMasterKey(OTHER_PHRASE)).key;
    const sealed = await encryptFile(key, bytes('hola'));
    const altered = sealed.data.slice();
    altered[altered.length - 1] ^= 1;
    await expect(decryptFile(key, sealed.wrappedFileKey, altered)).rejects.toThrow();
    await expect(decryptFile(other, sealed.wrappedFileKey, sealed.data)).rejects.toThrow();
  });
});
