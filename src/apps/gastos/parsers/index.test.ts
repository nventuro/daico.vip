import { describe, it, expect } from 'vitest';
import { parseStatement } from './index';
import { words } from './testing/fixture';
import { pages as visaPages } from './testing/galiciaVisaPages';
import { pages as mastercardPages } from './testing/galiciaMastercardPages';

describe('parseStatement', () => {
  it('reads each layout with the parser that is its own', () => {
    expect(parseStatement(visaPages()).format).toBe('galicia-visa');
    expect(parseStatement(mastercardPages()).format).toBe('galicia-mastercard');
  });

  it('refuses pages of no layout it knows', () => {
    expect(() => parseStatement([[words('Hola', 20)]])).toThrow(/No parece un resumen/);
  });
});
