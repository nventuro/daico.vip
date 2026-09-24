import { describe, expect, it } from 'vitest';
import type { PantryItem } from '../../lib/offline/specs';
import {
  expiryLabel,
  expiryPatch,
  groupPantry,
  isExpiring,
  isGoneOff,
  itemSubtitle,
  monthOnlyPatch,
} from './pantry';

// 2026-09-24 is a Thursday.
const TODAY = '2026-09-24';

function item(fields: Partial<PantryItem> & { id: string }): PantryItem {
  return {
    title: fields.id,
    expires_on: null,
    expires_month_only: false,
    place: 'cupboard',
    comments: null,
    used_on: null,
    created_at: '2026-09-01T00:00:00Z',
    updated_at: '2026-09-01T00:00:00Z',
    ...fields,
  };
}

describe('isExpiring', () => {
  it('announces what expires within two weeks, and what already did', () => {
    expect(isExpiring(item({ id: 'a', expires_on: '2026-10-08' }), TODAY)).toBe(true);
    expect(isExpiring(item({ id: 'b', expires_on: '2026-09-20' }), TODAY)).toBe(true);
    expect(isExpiring(item({ id: 'c', expires_on: '2026-10-09' }), TODAY)).toBe(false);
  });

  it('never announces an undated item, nor one used up', () => {
    expect(isExpiring(item({ id: 'a' }), TODAY)).toBe(false);
    expect(
      isExpiring(item({ id: 'b', expires_on: '2026-09-20', used_on: '2026-09-21' }), TODAY),
    ).toBe(false);
  });
});

describe('isGoneOff', () => {
  it('is past the day it was good through, for an item still in the house', () => {
    expect(isGoneOff(item({ id: 'a', expires_on: '2026-09-23' }), TODAY)).toBe(true);
    expect(isGoneOff(item({ id: 'b', expires_on: TODAY }), TODAY)).toBe(false);
    expect(
      isGoneOff(item({ id: 'c', expires_on: '2026-09-23', used_on: '2026-09-22' }), TODAY),
    ).toBe(false);
  });
});

describe('groupPantry', () => {
  it('splits the list into what is close, the rest, and what was used, last used first', () => {
    const items = [
      item({ id: 'gone', expires_on: '2026-09-22' }),
      item({ id: 'soon', expires_on: '2026-10-05' }),
      item({ id: 'later', expires_on: '2027-01-14' }),
      item({ id: 'undated' }),
      item({ id: 'used-early', used_on: '2026-09-02' }),
      item({ id: 'used-late', used_on: '2026-09-19' }),
    ];
    const { soon, later, used } = groupPantry(items, TODAY);
    expect(soon.map((i) => i.id)).toEqual(['gone', 'soon']);
    expect(later.map((i) => i.id)).toEqual(['later', 'undated']);
    expect(used.map((i) => i.id)).toEqual(['used-late', 'used-early']);
  });
});

describe('expiryLabel', () => {
  it('says the day, or only the month when the package gives no day', () => {
    expect(expiryLabel('2026-10-05', false, TODAY)).toBe('vence 05/10/2026');
    expect(expiryLabel('2026-09-22', false, TODAY)).toBe('venció 22/09/2026');
    expect(expiryLabel('2027-03-31', true, TODAY)).toBe('vence 03/2027');
  });

  it('holds a month good until its last day', () => {
    expect(expiryLabel('2026-09-30', true, TODAY)).toBe('vence 09/2026');
    expect(expiryLabel('2026-08-31', true, TODAY)).toBe('venció 08/2026');
  });
});

describe('itemSubtitle', () => {
  it('says when it expires and where it is', () => {
    expect(itemSubtitle(item({ id: 'a', expires_on: '2026-10-05', place: 'fridge' }), TODAY)).toBe(
      'vence 05/10/2026 · heladera',
    );
    expect(itemSubtitle(item({ id: 'b' }), TODAY)).toBe('sin fecha · alacena');
  });

  it('says when a used item was used, whatever its expiry', () => {
    const used = item({
      id: 'a',
      expires_on: '2026-10-05',
      used_on: '2026-09-19',
      place: 'freezer',
    });
    expect(itemSubtitle(used, TODAY)).toBe('usado 19/09/2026 · freezer');
  });
});

describe('expiryPatch', () => {
  it('keeps the day as picked', () => {
    expect(expiryPatch(item({ id: 'a' }), '2026-10-05')).toEqual({ expires_on: '2026-10-05' });
  });

  it('keeps only the month of a day picked for a month-only item', () => {
    const monthOnly = item({ id: 'a', expires_on: '2027-03-31', expires_month_only: true });
    expect(expiryPatch(monthOnly, '2027-05-12')).toEqual({ expires_on: '2027-05-31' });
  });

  it('takes the month-only flag away with the date', () => {
    const monthOnly = item({ id: 'a', expires_on: '2027-03-31', expires_month_only: true });
    expect(expiryPatch(monthOnly, null)).toEqual({ expires_on: null, expires_month_only: false });
  });
});

describe('monthOnlyPatch', () => {
  it('moves the date to the last day of its month', () => {
    expect(monthOnlyPatch(item({ id: 'a', expires_on: '2027-03-05' }), true)).toEqual({
      expires_month_only: true,
      expires_on: '2027-03-31',
    });
  });

  it('keeps no month for an item with no date', () => {
    expect(monthOnlyPatch(item({ id: 'a' }), true)).toEqual({ expires_month_only: false });
  });

  it('leaves the date where it is when the day is back', () => {
    const monthOnly = item({ id: 'a', expires_on: '2027-03-31', expires_month_only: true });
    expect(monthOnlyPatch(monthOnly, false)).toEqual({ expires_month_only: false });
  });
});
