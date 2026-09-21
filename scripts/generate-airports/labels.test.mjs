import { describe, it, expect } from 'vitest';
import {
  airportsOf,
  cleanCity,
  isUnbacked,
  labelAirports,
  plainRegion,
  shortName,
} from './labels.mjs';

/** An airport as `airportsOf` hands it over: a big one at the origin unless told otherwise. */
function airport(code, municipality, overrides = {}) {
  return {
    code,
    type: 'large_airport',
    name: `${municipality} Airport`,
    municipality,
    country: 'AA',
    region: 'AA-1',
    scheduled: true,
    latitude: 0,
    longitude: 0,
    keywords: '',
    ...overrides,
  };
}

const COUNTRIES = { AA: 'Alfa', BB: 'Beta' };
const REGIONS = { 'AA-1': 'North', 'AA-2': 'South' };

function labels(airports, names = {}) {
  const { entries, problems } = labelAirports(airports, {
    names,
    countryName: (code) => COUNTRIES[code],
    regionName: (code) => REGIONS[code] ?? null,
  });
  return { problems, byCode: Object.fromEntries(entries.map((e) => [e.airport.code, e.label])) };
}

describe('airportsOf', () => {
  const record = (overrides) => ({
    iata_code: 'AAA',
    type: 'large_airport',
    name: 'Alfa Airport',
    municipality: 'Alfa',
    iso_country: 'AA',
    iso_region: 'AA-1',
    scheduled_service: 'yes',
    latitude_deg: '1.5',
    longitude_deg: '-2.5',
    keywords: '',
    ...overrides,
  });

  it('keeps the open airports that have a code, one per code', () => {
    const airports = airportsOf([
      record({}),
      record({ iata_code: '' }),
      record({ iata_code: 'BBB', type: 'closed' }),
      record({ name: 'Alfa Again' }),
      record({ iata_code: 'ccc', scheduled_service: 'no' }),
    ]);
    expect(airports.map((a) => [a.code, a.name, a.scheduled])).toEqual([
      ['AAA', 'Alfa Airport', true],
      ['CCC', 'Alfa Airport', false],
    ]);
    expect(airports[0]).toMatchObject({ latitude: 1.5, longitude: -2.5, country: 'AA' });
  });
});

describe('cleanCity', () => {
  it('stops at the district, the county or the second town', () => {
    expect(cleanCity('Buenos Aires (Ezeiza)')).toBe('Buenos Aires');
    expect(cleanCity('Dubai(Jebel Ali)')).toBe('Dubai');
    expect(cleanCity('Nice, Alpes-Maritimes')).toBe('Nice');
    expect(cleanCity('La Paz / El Alto')).toBe('La Paz');
  });

  it('takes the accents the official name spells the same word with', () => {
    expect(cleanCity('Rio Gallegos', 'Piloto Norberto Fernández – Río Gallegos Airport')).toBe(
      'Río Gallegos',
    );
    expect(cleanCity('Málaga', 'Malaga Airport')).toBe('Málaga');
    expect(cleanCity('Oslo', 'Oslo Airport')).toBe('Oslo');
  });
});

describe('shortName', () => {
  const called = (name, city) => shortName({ code: 'AAA', name }, city);

  it('is the official name without the city and the words any airport has', () => {
    expect(called('London Gatwick Airport', 'London')).toBe('Gatwick');
    expect(called('Stockholm-Arlanda Airport', 'Stockholm')).toBe('Arlanda');
    expect(called('Montreal / Pierre Elliott Trudeau International Airport', 'Montréal')).toBe(
      'Pierre Elliott Trudeau',
    );
  });

  it('stops at the first dash that says something', () => {
    expect(called('Ezeiza International Airport - Ministro Pistarini', 'Buenos Aires')).toBe(
      'Ezeiza',
    );
    expect(called('São Paulo/Guarulhos–Governor André Franco Montoro', 'São Paulo')).toBe(
      'Guarulhos',
    );
  });

  it("keeps a small word that is the airport's own and not the city's", () => {
    expect(called('Francisco de Assis Airport', 'Juiz de Fora')).toBe('Francisco de Assis');
  });

  it('drops an aside, which would not read inside a parenthesis', () => {
    expect(called('Marka International (Amman Civil) Airport', 'Amman')).toBe('Marka');
  });

  it('says it is the international one, or else its code, when nothing else is left', () => {
    expect(called('Dubai International Airport', 'Dubai')).toBe('International');
    expect(called('Hotan Airport', 'Hotan')).toBe('AAA');
  });
});

describe('labelAirports', () => {
  it('calls the only airport of its name by its city', () => {
    expect(labels([airport('AAA', 'Alfa')]).byCode).toEqual({ AAA: 'Alfa' });
  });

  it("tells a city's airports apart by name when none is busier than the rest", () => {
    const { byCode } = labels([
      airport('AAA', 'Alfa', { name: 'Alfa North Airport' }),
      airport('AAB', 'Alfa', { name: 'Alfa South Airport' }),
    ]);
    expect(byCode).toEqual({ AAA: 'Alfa (North)', AAB: 'Alfa (South)' });
  });

  it('leaves the busiest airport of a city plain, and names the others', () => {
    const { byCode } = labels([
      airport('AAB', 'Alfa', { name: 'Alfa Executive Airport', type: 'medium_airport' }),
      airport('AAA', 'Alfa'),
      airport('AAC', 'Alfa', { name: 'Alfa Heliport', type: 'heliport', scheduled: false }),
    ]);
    expect(byCode).toEqual({ AAA: 'Alfa', AAB: 'Alfa (Executive)', AAC: 'Alfa (Heliport)' });
  });

  it('gives every place of one name its country when airlines fly to more than one', () => {
    const { byCode } = labels([
      airport('AAA', 'Alfa'),
      airport('BBB', 'Alfa', {
        country: 'BB',
        region: 'BB-1',
        latitude: 40,
        type: 'medium_airport',
      }),
    ]);
    expect(byCode).toEqual({ AAA: 'Alfa (Alfa)', BBB: 'Alfa (Beta)' });
  });

  it('never makes a place explain itself over one no airline flies to', () => {
    const { byCode } = labels([
      airport('AAA', 'Alfa'),
      airport('BBB', 'Alfa', { country: 'BB', region: 'BB-1', latitude: 40, scheduled: false }),
    ]);
    expect(byCode).toEqual({ AAA: 'Alfa', BBB: 'Alfa (Beta)' });
  });

  it('says the region where the country is the same', () => {
    const { byCode } = labels([
      airport('AAA', 'Alfa'),
      airport('AAB', 'Alfa', { region: 'AA-2', latitude: 40 }),
      airport('BBB', 'Alfa', { country: 'BB', region: 'BB-1', latitude: -40 }),
    ]);
    expect(byCode).toEqual({ AAA: 'Alfa (North)', AAB: 'Alfa (South)', BBB: 'Alfa (Beta)' });
  });

  it('takes one name inside one region for one place, however far apart', () => {
    const { byCode } = labels([
      airport('AAA', 'Alfa'),
      airport('AAB', 'Alfa', { name: 'Alfa Island Airport', type: 'small_airport', latitude: 5 }),
    ]);
    expect(byCode).toEqual({ AAA: 'Alfa', AAB: 'Alfa (Island)' });
  });

  it('groups a city by its name without accents, spelled the way its busiest airport has it', () => {
    const { byCode } = labels([
      airport('AAA', 'Álfa'),
      airport('AAB', 'alfa', { name: 'Alfa Executive Airport', type: 'small_airport' }),
    ]);
    expect(byCode).toEqual({ AAA: 'Álfa', AAB: 'Álfa (Executive)' });
  });

  it('takes what was written by hand in place of what the dataset says', () => {
    const { byCode, problems } = labels(
      [
        airport('AAA', 'Alfa Suburb', { name: 'Alfa General Someone International Airport' }),
        airport('AAB', 'Alfa', { name: 'Alfa City Airport' }),
      ],
      { AAA: { city: 'Alfa', name: 'Someone' } },
    );
    expect(problems).toEqual([]);
    expect(byCode).toEqual({ AAA: 'Alfa (Someone)', AAB: 'Alfa (City)' });
  });

  it('never lets two airports read alike', () => {
    const { byCode, problems } = labels([
      airport('AAA', 'Alfa', { name: 'Alfa Airport' }),
      airport('AAB', 'Alfa', { name: 'Alfa Airfield' }),
    ]);
    expect(problems).toEqual([]);
    expect(new Set(Object.values(byCode)).size).toBe(2);
  });

  it('refuses a name written for a code the dataset does not have', () => {
    const { problems } = labels([airport('AAA', 'Alfa')], { ZZZ: { city: 'Zeta' } });
    expect(problems).toEqual(['ZZZ is named by hand but is not in the dataset']);
  });

  it('lists the airports a ticket is likeliest to name first', () => {
    const { entries } = labelAirports(
      [
        airport('CCC', 'Gamma', { scheduled: false }),
        airport('BBB', 'Beta', { type: 'medium_airport' }),
        airport('AAA', 'Alfa'),
      ],
      { names: {}, countryName: () => '', regionName: () => null },
    );
    expect(entries.map((entry) => entry.airport.code)).toEqual(['AAA', 'BBB', 'CCC']);
  });
});

describe('plainRegion', () => {
  it('is the region without what kind of region it is', () => {
    expect(plainRegion('Heilongjiang Province')).toBe('Heilongjiang');
    expect(plainRegion('Guangxi Autonomous Region')).toBe('Guangxi');
    expect(plainRegion('Queensland')).toBe('Queensland');
  });
});

describe('isUnbacked', () => {
  const entry = (written) => ({
    written,
    airport: airport('AAA', 'Alfa Suburb', { name: 'Alfa Airport', keywords: 'Alpha' }),
  });

  it('is what was written by hand and appears nowhere in the record', () => {
    expect(isUnbacked(entry({ city: 'Alfa' }))).toBe(false);
    expect(isUnbacked(entry({ city: 'Alpha' }))).toBe(false);
    expect(isUnbacked(entry({ city: 'Beta' }))).toBe(true);
    expect(isUnbacked(entry({ city: 'Alfa', name: 'Someone' }))).toBe(true);
    expect(isUnbacked(entry({}))).toBe(false);
  });
});
