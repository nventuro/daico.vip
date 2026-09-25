import { describe, expect, it } from 'vitest';
import type { PantryItem } from '../../lib/offline/specs';
import { expiryLabel, expiryOf, groupPantry, isExpiring, isGoneOff, itemSubtitle } from './pantry';

// 2026-09-24 is a Thursday.
const TODAY = '2026-09-24';

function item(fields: Partial<PantryItem> & { id: string }): PantryItem {
  return {
    title: fields.id,
    expires_on: null,
    place: 'cupboard',
    comments: null,
    used_on: null,
    created_at: '2026-09-01T00:00:00Z',
    updated_at: '2026-09-01T00:00:00Z',
    ...fields,
  };
}

describe('expiryOf', () => {
  it('keeps a month as its last day', () => {
    expect(expiryOf('2026-10')).toBe('2026-10-31');
    expect(expiryOf('2028-02')).toBe('2028-02-29');
    expect(expiryOf(null)).toBe(null);
  });
});

describe('isExpiring', () => {
  it('announces an item from the first day of the month it expires in', () => {
    const october = item({ id: 'a', expires_on: '2026-10-31' });
    expect(isExpiring(october, '2026-09-30')).toBe(false);
    expect(isExpiring(october, '2026-10-01')).toBe(true);
    expect(isExpiring(october, '2026-10-31')).toBe(true);
  });

  it('keeps announcing one gone off until it is marked', () => {
    expect(isExpiring(item({ id: 'a', expires_on: '2026-08-31' }), TODAY)).toBe(true);
  });

  it('never announces an undated item, nor one used up', () => {
    expect(isExpiring(item({ id: 'a' }), TODAY)).toBe(false);
    expect(
      isExpiring(item({ id: 'b', expires_on: '2026-08-31', used_on: '2026-09-21' }), TODAY),
    ).toBe(false);
  });
});

describe('isGoneOff', () => {
  it('is past the month it expires in, for an item still in the house', () => {
    expect(isGoneOff(item({ id: 'a', expires_on: '2026-08-31' }), TODAY)).toBe(true);
    expect(isGoneOff(item({ id: 'b', expires_on: '2026-09-30' }), TODAY)).toBe(false);
    expect(
      isGoneOff(item({ id: 'c', expires_on: '2026-08-31', used_on: '2026-09-22' }), TODAY),
    ).toBe(false);
  });
});

describe('groupPantry', () => {
  it('splits the list into what is close, the rest, and what was used, last used first', () => {
    const items = [
      item({ id: 'gone', expires_on: '2026-08-31' }),
      item({ id: 'this-month', expires_on: '2026-09-30' }),
      item({ id: 'later', expires_on: '2026-10-31' }),
      item({ id: 'undated' }),
      item({ id: 'used-early', used_on: '2026-09-02' }),
      item({ id: 'used-late', used_on: '2026-09-19' }),
    ];
    const { soon, later, used } = groupPantry(items, TODAY);
    expect(soon.map((i) => i.id)).toEqual(['gone', 'this-month']);
    expect(later.map((i) => i.id)).toEqual(['later', 'undated']);
    expect(used.map((i) => i.id)).toEqual(['used-late', 'used-early']);
  });
});

describe('expiryLabel', () => {
  it('says the month, and that it went off once the month is over', () => {
    expect(expiryLabel('2027-03-31', TODAY)).toBe('vence 03/2027');
    expect(expiryLabel('2026-09-30', TODAY)).toBe('vence 09/2026');
    expect(expiryLabel('2026-08-31', TODAY)).toBe('venció 08/2026');
  });
});

describe('itemSubtitle', () => {
  it('says when it expires and where it is', () => {
    expect(itemSubtitle(item({ id: 'a', expires_on: '2026-10-31', place: 'fridge' }), TODAY)).toBe(
      'vence 10/2026 · heladera',
    );
    expect(itemSubtitle(item({ id: 'b' }), TODAY)).toBe('sin fecha · alacena');
  });

  it('says when a used item was used, whatever its expiry', () => {
    const used = item({
      id: 'a',
      expires_on: '2026-10-31',
      used_on: '2026-09-19',
      place: 'freezer',
    });
    expect(itemSubtitle(used, TODAY)).toBe('usado 19/09/2026 · freezer');
  });
});
