import { describe, it, expect } from 'vitest';
import type { Trip, TripItem, TripKind } from '../../lib/offline/specs';
import { itemSubtitle, tripSubtitle } from './labels';

const TODAY = '2026-09-01';

function item(kind: TripKind, overrides: Partial<TripItem> = {}): TripItem {
  return {
    id: 'i',
    trip_id: 'v',
    kind,
    title: 'x',
    on_date: null,
    at_time: null,
    ends_on: null,
    ends_at: null,
    from_code: null,
    to_code: null,
    done: false,
    comments: null,
    created_at: '2026-01-01T00:00:00Z',
    updated_at: '2026-01-01T00:00:00Z',
    ...overrides,
  };
}

describe('itemSubtitle', () => {
  it('says where a pasaje goes, on what day and between what hours', () => {
    const pasaje = item('ticket', {
      from_code: 'AEP',
      to_code: 'BRC',
      on_date: '2026-09-12',
      at_time: '08:40',
      ends_on: '2026-09-12',
      ends_at: '11:05',
    });
    expect(itemSubtitle(pasaje, TODAY)).toBe('AEP → BRC · sáb 12 sept, 8:40 – 11:05');
  });

  it('repeats the day of a flight that lands on another one', () => {
    const overnight = item('ticket', {
      from_code: 'EZE',
      to_code: 'MAD',
      on_date: '2026-09-12',
      at_time: '23:55',
      ends_on: '2026-09-13',
      ends_at: '16:30',
    });
    expect(itemSubtitle(overnight, TODAY)).toBe(
      'EZE → MAD · sáb 12 sept, 23:55 – dom 13 sept, 16:30',
    );
  });

  it('says nothing of a pasaje that has nothing filled in yet', () => {
    expect(itemSubtitle(item('ticket'), TODAY)).toBeUndefined();
  });

  it('reads the hour the server writes back the same way', () => {
    const reserva = item('booking', { on_date: '2026-09-12', at_time: '20:30:00' });
    expect(itemSubtitle(reserva, TODAY)).toBe('sáb 12 sept, 20:30');
  });

  it('counts the nights of an alojamiento and says the month once', () => {
    const stay = item('lodging', { on_date: '2026-09-12', ends_on: '2026-09-19' });
    expect(itemSubtitle(stay, TODAY)).toBe('12 → 19 sept · 7 noches');
  });

  it('spells both months of a stay that crosses one', () => {
    const stay = item('lodging', { on_date: '2026-09-28', ends_on: '2026-10-01' });
    expect(itemSubtitle(stay, TODAY)).toBe('28 sept → 1 oct · 3 noches');
  });

  it('gives a pendiente its day alone, and a lugar nothing', () => {
    expect(itemSubtitle(item('todo', { on_date: '2026-09-02' }), TODAY)).toBe('mañana');
    expect(itemSubtitle(item('todo'), TODAY)).toBeUndefined();
    expect(itemSubtitle(item('place'), TODAY)).toBeUndefined();
  });
});

describe('tripSubtitle', () => {
  const trip = (starts_on: string | null, ends_on: string | null = null): Trip => ({
    id: 'v',
    title: 'japón',
    starts_on,
    ends_on,
    created_at: '2026-01-01T00:00:00Z',
    updated_at: '2026-01-01T00:00:00Z',
  });

  it('says the days and what is left to resolve', () => {
    expect(tripSubtitle(trip('2026-09-12', '2026-09-26'), 3, TODAY)).toBe(
      '12 → 26 sept · 3 pendientes',
    );
  });

  it('says only the days once nothing is pending', () => {
    expect(tripSubtitle(trip('2026-09-12', '2026-09-26'), 0, TODAY)).toBe('12 → 26 sept');
  });

  it('says only what is pending while the trip has no dates', () => {
    expect(tripSubtitle(trip(null), 1, TODAY)).toBe('1 pendiente');
    expect(tripSubtitle(trip(null), 0, TODAY)).toBeUndefined();
  });
});
