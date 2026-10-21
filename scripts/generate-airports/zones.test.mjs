import { describe, it, expect } from 'vitest';
import { airportZones, zoneLines } from './zones.mjs';

/** An airport as `airportsOf` hands it over, with only what a zone is found by. */
function airport(code, country, idents = []) {
  return { code, country, idents };
}

/** An entry of the dataset, as mwgg/Airports writes one. */
function entry(icao, iata, country, tz) {
  return { icao, iata, country, tz };
}

function dataset(...entries) {
  return Object.fromEntries(entries.map((e) => [e.icao, e]));
}

describe('airportZones', () => {
  it('finds an airport by the codes it goes by before its IATA code', () => {
    const zones = airportZones(
      [airport('AAA', 'US', ['KAAA'])],
      dataset(
        entry('KAAA', 'AAA', 'US', 'America/Chicago'),
        entry('KZZZ', 'AAA', 'US', 'America/Denver'),
      ),
    );
    expect(zones.get('AAA')).toBe('America/Chicago');
  });

  it('takes an IATA code only in the airport’s own country', () => {
    const zones = airportZones(
      [airport('BBB', 'US'), airport('CCC', 'US')],
      dataset(
        entry('KBBB', 'BBB', 'US', 'America/New_York'),
        entry('ORCC', 'CCC', 'IQ', 'Asia/Baghdad'),
        entry('KDDD', 'DDD', 'US', 'America/Chicago'),
      ),
    );
    expect(zones.get('BBB')).toBe('America/New_York');
    expect(zones.has('CCC')).toBe(false);
  });

  it('gives an airport the dataset lacks its country’s one zone, and none across several', () => {
    const zones = airportZones(
      [airport('DDD', 'IN'), airport('EEE', 'US')],
      dataset(
        entry('VAAA', 'AAA', 'IN', 'Asia/Kolkata'),
        entry('VBBB', 'BBB', 'IN', 'Asia/Calcutta'),
        entry('VCCC', 'CCC', 'IN', 'Asia/Kolkata'),
        entry('KAAA', 'FFF', 'US', 'America/New_York'),
        entry('KBBB', 'GGG', 'US', 'America/Chicago'),
      ),
    );
    expect(zones.get('DDD')).toBe('Asia/Kolkata');
    expect(zones.has('EEE')).toBe(false);
  });

  it('leaves out a zone the runtime does not know', () => {
    const zones = airportZones(
      [airport('HHH', 'AA', ['AHHH'])],
      dataset(entry('AHHH', 'HHH', 'AA', 'Nowhere/Atlantis')),
    );
    expect(zones.has('HHH')).toBe(false);
  });
});

describe('zoneLines', () => {
  it('writes a line per zone, zones and codes in order', () => {
    const zones = new Map([
      ['MAD', 'Europe/Madrid'],
      ['LHR', 'Europe/London'],
      ['BCN', 'Europe/Madrid'],
    ]);
    expect(zoneLines(zones)).toEqual(['Europe/London LHR', 'Europe/Madrid BCN MAD']);
  });
});
