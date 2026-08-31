import { describe, it, expect } from 'vitest';
import type { TripItem } from '../../lib/offline/specs';
import { AIRPORTS, airportOptionValue, airportOptions, resolveAirportCode } from './airports';

function pasaje(from: string | null, to: string | null): TripItem {
  return {
    id: `${from}${to}`,
    trip_id: 'v',
    kind: 'ticket',
    title: 'vuelo',
    on_date: null,
    at_time: null,
    ends_on: null,
    ends_at: null,
    from_code: from,
    to_code: to,
    done: false,
    comments: null,
    created_at: '2026-01-01T00:00:00Z',
    updated_at: '2026-01-01T00:00:00Z',
  };
}

describe('AIRPORTS', () => {
  it('names every code once', () => {
    const codes = AIRPORTS.map(([code]) => code);
    expect(new Set(codes).size).toBe(codes.length);
    for (const [code, city] of AIRPORTS) {
      expect(code).toMatch(/^[A-Z]{3}$/);
      expect(city).not.toBe('');
    }
  });
});

describe('airportOptions', () => {
  it('offers the bundled list as it stands when nothing has been flown', () => {
    expect(airportOptions([])).toEqual(AIRPORTS);
  });

  it('puts the codes already flown first, most used first', () => {
    const items = [pasaje('AEP', 'BRC'), pasaje('BRC', 'AEP'), pasaje('EZE', 'MAD')];
    const offered = airportOptions(items).map(([code]) => code);
    expect(offered.slice(0, 4)).toEqual(['AEP', 'BRC', 'EZE', 'MAD']);
    // Each is offered once: what rises is taken out of the list below.
    expect(new Set(offered).size).toBe(offered.length);
    expect(offered).toHaveLength(AIRPORTS.length);
  });

  it('offers a code of its own that the list has never heard of', () => {
    const [first] = airportOptions([pasaje('ZZZ', null)]);
    expect(first).toEqual(['ZZZ', '']);
  });
});

describe('airportOptionValue', () => {
  it('leads with the code, so a narrow list still shows it', () => {
    expect(airportOptionValue('BRC', 'Bariloche')).toBe('BRC — Bariloche');
  });

  it('is the code alone for one the list cannot name', () => {
    expect(airportOptionValue('ZZZ', '')).toBe('ZZZ');
  });
});

describe('resolveAirportCode', () => {
  it('takes the code out of a picked option', () => {
    expect(resolveAirportCode(airportOptionValue('BRC', 'Bariloche'))).toBe('BRC');
  });

  it('takes three letters that name an airport as that airport', () => {
    expect(resolveAirportCode('aep')).toBe('AEP');
    // FEZ is both a code and the whole of its city; the code wins.
    expect(resolveAirportCode('fez')).toBe('FEZ');
  });

  it('still takes three letters the list has never heard of', () => {
    expect(resolveAirportCode(' zzz ')).toBe('ZZZ');
  });

  it('reads three letters as a code even where they begin a city', () => {
    // Three letters and a stop is how a code is typed, so «bar» is BAR; going
    // on spelling the city out is what leaves the code behind.
    expect(resolveAirportCode('bar')).toBe('BAR');
    // «bari» is still Bari's own code as much as Bariloche's start.
    expect(resolveAirportCode('bari')).toBeNull();
    expect(resolveAirportCode('baril')).toBe('BRC');
  });

  it('finds an airport by its city, ignoring case and accents', () => {
    expect(resolveAirportCode('bariloche')).toBe('BRC');
    expect(resolveAirportCode('baril')).toBe('BRC');
    expect(resolveAirportCode('MUNICH')).toBe('MUC');
    expect(resolveAirportCode('aeroparque')).toBe('AEP');
    expect(resolveAirportCode('goa')).toBe('GOI');
  });

  it('waits while what is typed could still be any of several', () => {
    // Both Paris airports answer to it, and picking between them is the point.
    expect(resolveAirportCode('paris')).toBeNull();
    expect(resolveAirportCode('b')).toBeNull();
  });

  it('holds nothing for what names no airport at all', () => {
    expect(resolveAirportCode('')).toBeNull();
    expect(resolveAirportCode('   ')).toBeNull();
    expect(resolveAirportCode('no existe')).toBeNull();
  });
});
