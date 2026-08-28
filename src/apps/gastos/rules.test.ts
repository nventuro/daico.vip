import { describe, it, expect } from 'vitest';
import { categoryOf, merchantKey, parseRulesText, type Rule } from './rules';
import type { StatementLine } from './statement';

const line = (description: string, charge = false): StatementLine => ({
  on: '2026-08-01',
  description,
  installment: null,
  ars_cents: 100,
  usd_cents: 0,
  charge,
  one_off: false,
});

const rule = (pattern: string, category: Rule['category'], id = pattern): Rule => ({
  id,
  pattern,
  category,
});

describe('merchantKey', () => {
  it.each([
    ['MERPAGO*CLUBVEGA', 'CLUBVEGA'],
    ['PROPINA*CAFE ORBITA', 'CAFE ORBITA'],
    ['PAYU*AR*GIMNORTE', 'GIMNORTE'],
    ['418302*ARENA COSMOS', 'ARENA COSMOS'],
    ['NEBULA* CLOUD ab3X9kQzRUSD 100,51', 'NEBULA CLOUD'],
    ['ZANDOR *Play (USA,USD, 2,49)', 'ZANDOR PLAY'],
    ['RODAR7719KQMZTX4C', 'RODAR'],
    ['ZANDOR UK* K71QZ4D20 GBP 141,45', 'ZANDOR UK'],
    ['TIENDA SOL 318', 'TIENDA SOL'],
    ['PLANMED 000012345678901', 'PLANMED'],
    ['PEDIDOS ARG S.A.S.', 'PEDIDOS ARG S.A.S.'],
    ['SEGUROS ANDINA0130011223344-001-000', 'SEGUROS ANDINA'],
    ['MERPAGO*2210KIOSCOS', 'KIOSCOS'],
    ['1CLAVE (CAN,USD, 59,85)', 'CLAVE'],
    ['LUMEN.COM 738201455USD 14,87', 'LUMEN.COM'],
    ['Nube Uno B31482760USD 1,99', 'NUBE UNO'],
    ['RODAR AR 6173KQZMTB4', 'RODAR AR'],
    ['NIDO 4406-NIDO4406 AV CA', 'NIDO AV CA'],
    ['LUMEN.COM QpWzgfLkMUSD 13,89', 'LUMEN.COM'],
  ])('%s → %s', (description, key) => {
    expect(merchantKey(description)).toBe(key);
  });
});

describe('categoryOf', () => {
  it("files the bank's charges as taxes, whatever the rules", () => {
    expect(categoryOf(line('PERCEP.AFIP RG 4815 30%', true), [rule('PERCEP', 'otros')])).toEqual({
      category: 'impuestos',
      rule: null,
    });
  });

  it('files by the household rule the key contains, ignoring case and accents', () => {
    const rules = [rule('café', 'salidas')];
    expect(categoryOf(line('PROPINA*CAFE ORBITA'), rules)).toEqual({
      category: 'salidas',
      rule: rules[0],
    });
  });

  it('lets the longest household rule win', () => {
    const rules = [rule('ZANDOR', 'compras'), rule('ZANDOR PRIME', 'suscripciones')];
    expect(categoryOf(line('Zandor Prime*QK2 7hzRt3bPwGBP 8,99'), rules).rule).toBe(rules[1]);
    expect(categoryOf(line('ZANDOR UK* K71QZ4D20'), rules).rule).toBe(rules[0]);
  });

  it('files nothing no rule places, however telling the name', () => {
    expect(categoryOf(line('PIZZERIA SATURNO'), [])).toEqual({ category: null, rule: null });
  });
});

describe('parseRulesText', () => {
  it('reads a rule per line, the category last by id or as shown', () => {
    expect(parseRulesText('MERPAGO KIOSCOS supermercado\n\n  Café Órbita  Salidas \n')).toEqual({
      rules: [
        { pattern: 'MERPAGO KIOSCOS', category: 'supermercado' },
        { pattern: 'Café Órbita', category: 'salidas' },
      ],
      problems: [],
    });
  });

  it('keeps the last category of a merchant given twice', () => {
    expect(parseRulesText('ZANDOR compras\nzandor suscripciones').rules).toEqual([
      { pattern: 'zandor', category: 'suscripciones' },
    ]);
  });

  it('points at every line that is not a rule', () => {
    const { rules, problems } = parseRulesText('KIOSCO\nKIOSCO comida\nsalidas\nX salidas');
    expect(rules).toEqual([{ pattern: 'X', category: 'salidas' }]);
    expect(problems).toEqual([
      { line: 1, text: 'KIOSCO' },
      { line: 2, text: 'KIOSCO comida' },
      { line: 3, text: 'salidas' },
    ]);
  });
});
