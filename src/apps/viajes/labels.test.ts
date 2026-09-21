import { describe, it, expect } from 'vitest';
import type { Trip, TripItem, TripKind } from '../../lib/offline/specs';
import {
  boardingPassAddedLabel,
  boardingPassDueLabel,
  boardingPassLines,
  inboxSubtitle,
  itemLines,
  tripSubtitle,
} from './labels';

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
    transport: null,
    origin: null,
    destination: null,
    done: false,
    comments: null,
    created_at: '2026-01-01T00:00:00Z',
    updated_at: '2026-01-01T00:00:00Z',
    ...overrides,
  };
}

describe('itemLines', () => {
  it('gives a flight a line for each end: when, then the airport by code and city', () => {
    const pasaje = item('ticket', {
      transport: 'flight',
      origin: 'AEP',
      destination: 'BRC',
      on_date: '2026-09-12',
      at_time: '08:40',
      ends_on: '2026-09-12',
      ends_at: '11:05',
    });
    expect(itemLines(pasaje, TODAY)).toEqual([
      'sáb 12 sept, 8:40 · AEP Buenos Aires (Aeroparque)',
      '11:05 · BRC Bariloche',
    ]);
  });

  it('repeats the day of a flight that lands on another one', () => {
    const overnight = item('ticket', {
      transport: 'flight',
      origin: 'EZE',
      destination: 'MAD',
      on_date: '2026-09-12',
      at_time: '23:55',
      ends_on: '2026-09-13',
      ends_at: '16:30',
    });
    expect(itemLines(overnight, TODAY)).toEqual([
      'sáb 12 sept, 23:55 · EZE Buenos Aires (Ezeiza)',
      'dom 13 sept, 16:30 · MAD Madrid',
    ]);
  });

  it('names an airport the list has never heard of by its code alone', () => {
    const pasaje = item('ticket', { transport: 'flight', origin: 'XQX', destination: 'AEP' });
    expect(itemLines(pasaje, TODAY)).toEqual(['XQX', 'AEP Buenos Aires (Aeroparque)']);
  });

  it('names a station as it is written, even one that reads like a code', () => {
    const train = item('ticket', {
      transport: 'train',
      origin: 'London St Pancras',
      destination: 'MAD',
      on_date: '2026-09-17',
      at_time: '09:31',
      ends_at: '12:47',
    });
    expect(itemLines(train, TODAY)).toEqual([
      'jue 17 sept, 9:31 · London St Pancras',
      '12:47 · MAD',
    ]);
  });

  it('gives one line to a pasaje that only says how it leaves, and none to an empty one', () => {
    const leaving = item('ticket', { transport: 'bus', on_date: '2026-09-19', at_time: '20:30' });
    expect(itemLines(leaving, TODAY)).toEqual(['sáb 19 sept, 20:30']);
    expect(itemLines(item('ticket', { transport: 'flight' }), TODAY)).toEqual([]);
  });

  it('reads the hour the server writes back the same way', () => {
    const reserva = item('booking', { on_date: '2026-09-12', at_time: '20:30:00' });
    expect(itemLines(reserva, TODAY)).toEqual(['sáb 12 sept, 20:30']);
  });

  it('counts the nights of an alojamiento and says the month once', () => {
    const stay = item('lodging', { on_date: '2026-09-12', ends_on: '2026-09-19' });
    expect(itemLines(stay, TODAY)).toEqual(['12 → 19 sept · 7 noches']);
  });

  it('spells both months of a stay that crosses one', () => {
    const stay = item('lodging', { on_date: '2026-09-28', ends_on: '2026-10-01' });
    expect(itemLines(stay, TODAY)).toEqual(['28 sept → 1 oct · 3 noches']);
  });

  it('gives a pendiente its day alone, and a lugar nothing', () => {
    expect(itemLines(item('todo', { on_date: '2026-09-02' }), TODAY)).toEqual(['mañana']);
    expect(itemLines(item('todo'), TODAY)).toEqual([]);
    expect(itemLines(item('place'), TODAY)).toEqual([]);
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

describe('a boarding pass', () => {
  it('reads as what it is, then as its flight would', () => {
    const pass = item('ticket', {
      transport: 'flight',
      origin: 'AEP',
      destination: 'BRC',
      on_date: '2026-09-12',
      at_time: '08:40',
    });
    expect(boardingPassLines(pass, TODAY)).toEqual([
      'boarding pass · sáb 12 sept, 8:40 · AEP Buenos Aires (Aeroparque)',
      'BRC Bariloche',
    ]);
    expect(boardingPassLines(item('ticket', { transport: 'flight' }), TODAY)).toEqual([
      'boarding pass',
    ]);
  });

  it('is asked for by name on the home screen, and counted in a word that does not change', () => {
    expect(boardingPassDueLabel('AR 1420 · ida')).toBe('boarding pass · AR 1420 · ida');
    expect(inboxSubtitle(2, '2026-09-01T12:00:00Z', TODAY, true)).toContain('2 boarding pass ·');
    expect(inboxSubtitle(2, '2026-09-01T12:00:00Z', TODAY)).toContain('2 ítems ·');
    expect(boardingPassAddedLabel(1)).toBe('Se agregó 1 boarding pass');
    expect(boardingPassAddedLabel(2)).toBe('Se agregaron 2 boarding pass');
  });
});
