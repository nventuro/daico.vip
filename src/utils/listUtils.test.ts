import { describe, it, expect } from 'vitest';
import { groupByName, groupRuns } from './listUtils';

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
