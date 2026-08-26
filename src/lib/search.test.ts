import { describe, it, expect } from 'vitest';
import { excerpt, matches, normalize } from './search';

describe('normalize', () => {
  it('lower-cases and strips accents', () => {
    expect(normalize('Árbol')).toBe('arbol');
    expect(normalize('ÑOQUIS')).toBe('noquis');
    expect(normalize('café con leche')).toBe('cafe con leche');
  });

  it('leaves digits and punctuation alone', () => {
    expect(normalize('29/03, ¡hola! #1')).toBe('29/03, ¡hola! #1');
  });

  it('handles the empty string', () => {
    expect(normalize('')).toBe('');
  });
});

describe('matches', () => {
  it('ignores case and accents', () => {
    expect(matches('Cumpleaños', 'cumpleanos')).toBe(true);
    expect(matches('noquis', 'ÑOQUIS')).toBe(true);
  });

  it('is false for missing or empty text', () => {
    expect(matches(null, 'a')).toBe(false);
    expect(matches(undefined, 'a')).toBe(false);
    expect(matches('', 'a')).toBe(false);
  });

  it('is false when the query is absent', () => {
    expect(matches('abc', 'd')).toBe(false);
  });
});

describe('excerpt', () => {
  it('keeps radius characters either side of the match', () => {
    expect(excerpt('hola mundo cruel', 'mundo', 5)).toBe('hola mundo crue…');
    expect(excerpt('aaaaaaaaaa mundo bbbbbbbbbb', 'mundo', 3)).toBe('…aa mundo bb…');
  });

  it('finds the match ignoring case and accents but returns the original text', () => {
    expect(excerpt('Los Ñoquis del 29', 'noquis', 4)).toBe('Los Ñoquis del…');
  });

  it('collapses whitespace', () => {
    expect(excerpt('uno\n\ndos tres', 'dos', 2)).toBe('…o dos t…');
  });

  it('falls back to the head of the text when nothing matches', () => {
    expect(excerpt('hola mundo', 'xyz', 3)).toBe('hola m…');
  });

  it('adds no ellipsis when nothing is cut', () => {
    expect(excerpt('hola mundo', 'mundo', 10)).toBe('hola mundo');
    expect(excerpt('hola', 'xyz', 3)).toBe('hola');
  });
});
