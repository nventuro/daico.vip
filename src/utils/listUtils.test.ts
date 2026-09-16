import { describe, it, expect } from 'vitest';
import { compareLastDone, compareLastWritten, groupByName, groupRuns } from './listUtils';

const month = (date: string) => date.slice(0, 7);

describe('groupRuns', () => {
  it('cuts the list where the key changes, keeping the order', () => {
    expect(groupRuns(['2026-08-01', '2026-08-30', '2026-09-02'], month)).toEqual([
      { key: '2026-08', items: ['2026-08-01', '2026-08-30'] },
      { key: '2026-09', items: ['2026-09-02'] },
    ]);
  });

  it('starts a new run when a key comes back later', () => {
    expect(groupRuns(['a', 'b', 'a'], (s) => s).map((run) => run.key)).toEqual(['a', 'b', 'a']);
  });

  it('has no runs for an empty list', () => {
    expect(groupRuns([], month)).toEqual([]);
  });
});

/** A row as the comparators read it: its id, the day it was marked, and when
 *  it was last written. */
function row(id: string, last_done_on: string | null, updated_at: string) {
  return { id, last_done_on, created_at: '2026-01-01T00:00:00Z', updated_at };
}

describe('compareLastWritten', () => {
  it('puts the row written on last first', () => {
    const rows = [row('a', null, '2026-09-01T10:00:00Z'), row('b', null, '2026-09-02T10:00:00Z')];
    expect(rows.sort(compareLastWritten).map((r) => r.id)).toEqual(['b', 'a']);
  });

  it('compares instants, however the server spells them', () => {
    const device = row('device', null, '2026-09-01T10:00:00.500Z');
    const server = row('server', null, '2026-09-01T09:00:00.9+00:00');
    expect([server, device].sort(compareLastWritten).map((r) => r.id)).toEqual([
      'device',
      'server',
    ]);
  });
});

describe('compareLastDone', () => {
  it('puts the day marked last first, whenever each was written', () => {
    const early = row('early', '2026-08-01', '2026-09-10T00:00:00Z');
    const late = row('late', '2026-09-01', '2026-09-01T00:00:00Z');
    expect([early, late].sort(compareLastDone).map((r) => r.id)).toEqual(['late', 'early']);
  });

  it('puts the one written on last first on the same day', () => {
    const first = row('first', '2026-09-01', '2026-09-01T08:00:00Z');
    const second = row('second', '2026-09-01', '2026-09-01T20:00:00Z');
    expect([first, second].sort(compareLastDone).map((r) => r.id)).toEqual(['second', 'first']);
  });
});

describe('groupByName', () => {
  const first = (s: string) => s[0];

  it('heads every name in the order a person would look for it, items as given', () => {
    expect(groupByName(['casa', 'árbol', 'comer', 'cortinas'], first)).toEqual([
      { name: 'á', items: ['árbol'] },
      { name: 'c', items: ['casa', 'comer', 'cortinas'] },
    ]);
  });

  it('has no groups for an empty list', () => {
    expect(groupByName([], first)).toEqual([]);
  });
});
