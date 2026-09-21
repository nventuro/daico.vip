import { describe, it, expect } from 'vitest';
import { csvRecords } from './csv.mjs';

describe('csvRecords', () => {
  it('keys every row by the header', () => {
    expect(csvRecords('code,city\nAAA,Alfa\nBBB,Beta\n')).toEqual([
      { code: 'AAA', city: 'Alfa' },
      { code: 'BBB', city: 'Beta' },
    ]);
  });

  it('keeps the commas, quotes and line breaks a quoted field holds', () => {
    const [record] = csvRecords('code,name,notes\r\nAAA,"Alfa, ""the first""","two\nlines"\r\n');
    expect(record).toEqual({ code: 'AAA', name: 'Alfa, "the first"', notes: 'two\nlines' });
  });

  it('reads a last row that ends without a line break, and a field left empty', () => {
    expect(csvRecords('code,city,name\nAAA,,Alfa')).toEqual([
      { code: 'AAA', city: '', name: 'Alfa' },
    ]);
  });
});
