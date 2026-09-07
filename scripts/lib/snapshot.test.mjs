import { describe, it, expect } from 'vitest';
import { generateIdentity, identityToRecipient } from 'age-encryption';
import {
  decodeSnapshot,
  encodeSnapshot,
  manifestFor,
  open,
  problemsOf,
  seal,
  tableDigest,
} from './snapshot.mjs';

const tables = {
  'public.chores': [
    { id: 'b', title: 'regar', updated_at: '2026-09-07T01:00:00+00:00' },
    { id: 'a', title: 'barrer', updated_at: '2026-09-06T01:00:00+00:00' },
  ],
  'public.dates': [],
  'supabase_migrations.schema_migrations': [{ version: '20260621000000', name: 'init' }],
};

describe('a snapshot', () => {
  it('comes back as it went, whatever order the rows were read in', () => {
    const manifest = manifestFor('20260907T060000Z', tables, { migrations: ['20260621000000'] });
    const { manifest: read, tables: back } = decodeSnapshot(encodeSnapshot(manifest, tables));
    expect(read).toEqual(manifest);
    expect(back['public.chores'].map((row) => row.id)).toEqual(['a', 'b']);
    expect(back['public.dates']).toEqual([]);
    expect(back['supabase_migrations.schema_migrations']).toEqual(
      tables['supabase_migrations.schema_migrations'],
    );
    expect(problemsOf({ manifest: read, tables: back })).toEqual([]);
  });

  it('hashes the same rows the same in any order, and differently once one changes', () => {
    const [x, y] = tables['public.chores'];
    expect(tableDigest([x, y])).toBe(tableDigest([y, x]));
    expect(tableDigest([x, { ...y, title: 'regar más' }])).not.toBe(tableDigest([x, y]));
  });

  it('says what is missing or changed', () => {
    const manifest = manifestFor('s', tables);
    const short = { ...tables, 'public.chores': tables['public.chores'].slice(1) };
    expect(problemsOf({ manifest, tables: short })).toEqual([
      'public.chores: 1 rows, the manifest says 2',
    ]);
    const changed = {
      ...tables,
      'public.chores': [tables['public.chores'][0], { ...tables['public.chores'][1], title: 'x' }],
    };
    expect(problemsOf({ manifest, tables: changed })).toEqual([
      'public.chores: the rows do not hash to what the manifest says',
    ]);
  });

  it('refuses a file of a later version, and one that is not a snapshot', () => {
    const later = encodeSnapshot({ version: 99, tables: {} }, {});
    expect(() => decodeSnapshot(later)).toThrow('newer than this build reads');
    const noise = encodeSnapshot({ nothing: true }, {});
    expect(() => decodeSnapshot(noise)).toThrow('no manifest');
  });

  it('opens under the identity of the recipient it was sealed to, and no other', async () => {
    const identity = await generateIdentity();
    const other = await generateIdentity();
    const recipient = await identityToRecipient(identity);
    const plain = encodeSnapshot(manifestFor('s', tables), tables);
    const sealed = await seal(recipient, plain);
    expect(sealed).not.toEqual(plain);
    expect(await open(identity, sealed)).toEqual(plain);
    await expect(open(other, sealed)).rejects.toThrow();
  });
});
