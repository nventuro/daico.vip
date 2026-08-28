import { describe, it, expect } from 'vitest';
import { openContents, openPattern, sealContents, sealPattern, upgradeContents } from './payload';
import type { StatementContents } from './statement';

const masterKey = () =>
  crypto.subtle.generateKey({ name: 'AES-KW', length: 256 }, false, ['wrapKey', 'unwrapKey']);

const contents: StatementContents = {
  schema: 2,
  format: 'galicia-visa',
  number: 'VI0001',
  previous_closed_on: '2026-07-23',
  closed_on: '2026-08-20',
  due_on: '2026-09-01',
  previous_ars_cents: 1,
  previous_usd_cents: 2,
  pending_ars_cents: 0,
  pending_usd_cents: 0,
  minimum_ars_cents: 3,
  total_ars_cents: 4,
  total_usd_cents: 5,
  usd_rate: 1477.63,
  lines: Array.from({ length: 90 }, (_, i) => ({
    on: '2026-08-01',
    description: `MERPAGO*COMERCIO ${i}`,
    installment: null,
    ars_cents: i * 100,
    usd_cents: 0,
    charge: false,
    one_off: i % 7 === 0,
  })),
};

describe('a statement payload', () => {
  it('comes back whole, and a ninety-line statement stays a few KB', async () => {
    const key = await masterKey();
    const sealed = await sealContents(key, contents);
    expect(await openContents(key, sealed)).toEqual(contents);
    expect(sealed.payload.length).toBeLessThan(4_000);
  });

  it('does not open under another key', async () => {
    const sealed = await sealContents(await masterKey(), contents);
    await expect(openContents(await masterKey(), sealed)).rejects.toThrow();
  });

  it('opens one sealed under schema 1 in the current shape, the names it carried left out', async () => {
    const old: Record<string, unknown> = {
      ...contents,
      schema: 1,
      holders: [{ holder: 'TITULAR UNO', last4: '1111', ars_cents: 4, usd_cents: 5 }],
      lines: contents.lines.map((line) => ({ ...line, holder: 'TITULAR UNO' })),
      installments_due: [{ month: '2026-09', ars_cents: 6, onward: false }],
    };
    delete old.previous_closed_on;
    const key = await masterKey();
    const opened = await openContents(
      key,
      await sealContents(key, old as unknown as StatementContents),
    );
    expect(opened).toEqual({ ...contents, previous_closed_on: null });
    expect(JSON.stringify(opened)).not.toMatch(/TITULAR/);
    expect(
      upgradeContents(JSON.parse(JSON.stringify(contents)) as Record<string, unknown>),
    ).toEqual(contents);
  });
});

describe('a rule pattern', () => {
  it('comes back as typed', async () => {
    const key = await masterKey();
    expect(await openPattern(key, await sealPattern(key, 'Café Órbita'))).toBe('Café Órbita');
  });
});
