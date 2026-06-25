import { describe, it, expect } from 'vitest';
import { keyForAppend, keyForMove, positionBetween, type Positioned } from './ordering';

/** A list of n items in sort-key order, keyed by a fresh fractional sequence
 *  ('a0','a1',...) — i.e. the state right after the migration backfill. */
function makeList(n: number): Positioned[] {
  const items: Positioned[] = [];
  let prev: string | null = null;
  for (let i = 0; i < n; i++) {
    prev = positionBetween(prev, null);
    items.push({ id: String(i), position: prev });
  }
  return items;
}

/** Apply a move, then return the resulting ids in sort-key order. */
function orderAfterMove(items: Positioned[], fromId: string, toId: string): string[] {
  const key = keyForMove(items, fromId, toId);
  const next = items.map((i) => (i.id === fromId ? { ...i, position: key } : i));
  return [...next].sort((a, b) => (a.position! < b.position! ? -1 : 1)).map((i) => i.id);
}

describe('positionBetween', () => {
  it('returns a key strictly between its neighbours', () => {
    const a = positionBetween(null, null);
    const c = positionBetween(a, null);
    const b = positionBetween(a, c);
    expect(a < b).toBe(true);
    expect(b < c).toBe(true);
  });
});

describe('keyForAppend', () => {
  it('gives the first item a valid key', () => {
    expect(keyForAppend([])).toBe('a0');
  });

  it('sorts a new item after every existing one', () => {
    const items = makeList(5);
    expect(keyForAppend(items) > items[items.length - 1].position!).toBe(true);
  });
});

describe('keyForMove', () => {
  it('is a no-op when dropped on itself or when an id is missing', () => {
    const items = makeList(3);
    expect(keyForMove(items, '1', '1')).toBeNull();
    expect(keyForMove(items, '1', 'x')).toBeNull();
    expect(keyForMove(items, 'x', '1')).toBeNull();
  });

  it('moves an item to the top', () => {
    expect(orderAfterMove(makeList(4), '3', '0')).toEqual(['3', '0', '1', '2']);
  });

  it('moves an item to the bottom', () => {
    expect(orderAfterMove(makeList(4), '0', '3')).toEqual(['1', '2', '3', '0']);
  });

  it('moves an item into the middle, between the right neighbours', () => {
    expect(orderAfterMove(makeList(5), '0', '3')).toEqual(['1', '2', '3', '0', '4']);
  });

  it('keeps keys distinct and ordered across a run of moves', () => {
    let items = makeList(6);
    const moves: [string, string][] = [
      ['0', '3'],
      ['5', '1'],
      ['2', '4'],
      ['3', '0'],
      ['1', '5'],
    ];
    for (const [from, to] of moves) {
      const key = keyForMove(items, from, to);
      expect(key).not.toBeNull();
      items = items.map((i) => (i.id === from ? { ...i, position: key } : i));
      items = [...items].sort((a, b) => (a.position! < b.position! ? -1 : 1));
    }
    const keys = items.map((i) => i.position!);
    expect(new Set(keys).size).toBe(keys.length); // all distinct
    expect([...keys].sort()).toEqual(keys); // already ascending
  });

  it('returns null instead of throwing on duplicate neighbour keys', () => {
    // Two items share a key (shouldn't happen, but corrupt sync data could do
    // it): a move landing between them must bail rather than let the key
    // generator throw on equal bounds mid-drag.
    const corrupt: Positioned[] = [
      { id: 'p', position: 'a2' },
      { id: 'q', position: 'a2' },
      { id: 'r', position: 'a5' },
    ];
    expect(() => keyForMove(corrupt, 'r', 'q')).not.toThrow();
    expect(keyForMove(corrupt, 'r', 'q')).toBeNull();
  });
});
