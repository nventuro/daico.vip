import { describe, it, expect } from 'vitest';
import type { TripItem, TripTransport } from '../../lib/offline/specs';
import {
  AIRPORT_MATCHES_MAX,
  airportAfterTyping,
  airportFieldValue,
  airportLabel,
  airportMatches,
  airportOptionText,
  airportOptionValue,
  allAirports,
  ownAirports,
  pickedAirportCode,
  resolveAirportCode,
} from './airports';

function pasaje(
  from: string | null,
  to: string | null,
  transport: TripTransport = 'flight',
): TripItem {
  return {
    id: `${from}${to}`,
    trip_id: 'v',
    kind: 'ticket',
    title: 'vuelo',
    on_date: null,
    at_time: null,
    ends_on: null,
    ends_at: null,
    transport,
    origin: from,
    destination: to,
    done: false,
    comments: null,
    created_at: '2026-01-01T00:00:00Z',
    updated_at: '2026-01-01T00:00:00Z',
  };
}

describe('the bundled list', () => {
  it('names every code once, and no two airports alike', () => {
    const all = allAirports();
    expect(all.length).toBeGreaterThan(5000);
    expect(new Set(all.map(([code]) => code)).size).toBe(all.length);
    expect(new Set(all.map(([, label]) => label.toLowerCase())).size).toBe(all.length);
    for (const [code, label] of all) {
      expect(code).toMatch(/^[A-Z]{3}$/);
      expect(label.trim()).toBe(label);
      expect(label).not.toBe('');
    }
  });
});

describe('ownAirports', () => {
  it('is empty when nothing has been flown', () => {
    expect(ownAirports([])).toEqual([]);
  });

  it('lists the codes already flown, most used first', () => {
    const items = [pasaje('AEP', 'BRC'), pasaje('BRC', 'AEP'), pasaje('EZE', 'MAD')];
    expect(ownAirports(items)).toEqual(['AEP', 'BRC', 'EZE', 'MAD']);
  });

  it('keeps a code of its own that the list has never heard of', () => {
    expect(ownAirports([pasaje('XQX', null)])).toEqual(['XQX']);
  });

  it('never lists a station, whether a train names it or a flight was left holding it', () => {
    const items = [pasaje('MAD', 'BCN', 'train'), pasaje('London St Pancras', 'EZE')];
    expect(ownAirports(items)).toEqual(['EZE']);
  });
});

describe('airportMatches', () => {
  const codes = (typed: string, own: string[] = []) =>
    airportMatches(typed, own).map(([code]) => code);

  it("offers the household's own airports, and only those, before anything is typed", () => {
    expect(airportMatches('', ['BRC', 'XQX'])).toEqual([
      ['BRC', 'Bariloche'],
      ['XQX', ''],
    ]);
    expect(airportMatches('b', ['BRC'])).toEqual([['BRC', 'Bariloche']]);
    expect(airportMatches('', [])).toEqual([]);
  });

  it('finds an airport by its name without minding accents, or by its code', () => {
    expect(codes('tucuman')).toContain('TUC');
    expect(codes('TUCUMÁN')).toContain('TUC');
    expect(codes('sao pau')).toEqual(expect.arrayContaining(['GRU', 'CGH']));
    expect(codes('eze')[0]).toBe('EZE');
  });

  it("puts the household's own first, then what the text begins", () => {
    // «aires» begins no name, and still the one already flown through leads.
    expect(codes('aires', ['EZE'])[0]).toBe('EZE');
    expect(codes('madr')[0]).toBe('MAD');
  });

  it('never offers more than the field can show', () => {
    expect(codes('an')).toHaveLength(AIRPORT_MATCHES_MAX);
  });
});

describe('an airport by name', () => {
  it('is its code and city in a row, and what its option reads in its field', () => {
    expect(airportLabel('BRC')).toBe('BRC Bariloche');
    expect(airportFieldValue('BRC')).toBe('BRC — Bariloche');
  });

  it('says which airport where its city has several', () => {
    expect(airportLabel('AEP')).toBe('AEP Buenos Aires (Aeroparque)');
    expect(airportLabel('EZE')).toBe('EZE Buenos Aires (Ezeiza)');
  });

  it('is the code alone for one the list cannot name', () => {
    expect(airportLabel('XQX')).toBe('XQX');
    expect(airportFieldValue('XQX')).toBe('XQX');
  });

  it('reads back as the same code once its field is left untouched', () => {
    expect(resolveAirportCode(airportFieldValue('LGW'))).toBe('LGW');
  });
});

describe('airportOptionValue', () => {
  it('leads with the code, so a narrow list still shows it', () => {
    expect(airportOptionValue('BRC', 'Bariloche')).toBe('BRC — Bariloche');
  });

  it('is the code alone for one the list cannot name', () => {
    expect(airportOptionValue('XQX', '')).toBe('XQX');
  });
});

describe('airportOptionText', () => {
  it('writes an option the way it is being typed, so the browser does not hide it', () => {
    expect(airportOptionText('TUC', 'Tucumán', 'tucuman')).toBe('TUC — Tucuman');
    expect(airportOptionText('TUC', 'Tucumán', 'Tucumá')).toBe('TUC — Tucumán');
    // Up to the accent the letters are the same, and the name stays as it is.
    expect(airportOptionText('TUC', 'Tucumán', 'tucum')).toBe('TUC — Tucumán');
    expect(airportOptionText('IST', 'İstanbul', 'istan')).toBe('IST — Istanbul');
    expect(airportOptionText('BRC', 'Bariloche', '')).toBe('BRC — Bariloche');
  });

  it('reads back as the same code however it was written', () => {
    expect(pickedAirportCode(airportOptionText('TUC', 'Tucumán', 'tucuman'))).toBe('TUC');
    expect(pickedAirportCode('tucum')).toBeNull();
    expect(pickedAirportCode('TUC')).toBeNull();
  });
});

describe('resolveAirportCode', () => {
  it('takes the code out of a picked option', () => {
    expect(resolveAirportCode(airportOptionValue('BRC', 'Bariloche'))).toBe('BRC');
  });

  it('takes three letters as a code, listed or not, whatever city they begin', () => {
    expect(resolveAirportCode('aep')).toBe('AEP');
    expect(resolveAirportCode(' xqx ')).toBe('XQX');
    // Three letters and a stop is how a code is typed, so «bar» is BAR; going
    // on spelling the city out is what leaves the code behind.
    expect(resolveAirportCode('bar')).toBe('BAR');
  });

  it('finds an airport by the whole of what it is called', () => {
    // Other names begin with «bari»; only one airport is called just that.
    expect(resolveAirportCode('bari')).toBe('BRI');
    expect(resolveAirportCode('MADRID')).toBe('MAD');
  });

  it('finds one by a part of its name only one airport has, ignoring accents', () => {
    expect(resolveAirportCode('bariloc')).toBe('BRC');
    expect(resolveAirportCode('aeroparque')).toBe('AEP');
  });

  it('holds nothing while what is typed could be any of several', () => {
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

describe('airportAfterTyping', () => {
  it('takes the airport the text means', () => {
    expect(airportAfterTyping('madrid', 'EZE')).toBe('MAD');
    expect(airportAfterTyping('mad', null)).toBe('MAD');
  });

  it('keeps the airport it held when the text means none, or any of several', () => {
    expect(airportAfterTyping('paris', 'EZE')).toBe('EZE');
    expect(airportAfterTyping('no existe', 'EZE')).toBe('EZE');
    expect(airportAfterTyping('paris', null)).toBeNull();
  });

  it('holds none once the field is emptied', () => {
    expect(airportAfterTyping('', 'EZE')).toBeNull();
    expect(airportAfterTyping('  ', 'EZE')).toBeNull();
  });
});
