import { describe, it, expect } from 'vitest';
import { countLabel, lowercaseTrimmed, normalize } from './textUtils';

describe('countLabel', () => {
  it('picks the singular for exactly one', () => {
    expect(countLabel(1, 'guía', 'guías')).toBe('1 guía');
  });

  it('picks the plural otherwise', () => {
    expect(countLabel(3, 'guía', 'guías')).toBe('3 guías');
    expect(countLabel(0, 'guía', 'guías')).toBe('0 guías');
  });
});

describe('lowercaseTrimmed', () => {
  it('lower-cases and trims', () => {
    expect(lowercaseTrimmed('  Comprar Pan ')).toBe('comprar pan');
  });

  it('handles accented and ñ capitals', () => {
    expect(lowercaseTrimmed('Ñoquis Árabes')).toBe('ñoquis árabes');
  });

  it('is empty for blank input', () => {
    expect(lowercaseTrimmed('   ')).toBe('');
  });
});

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
