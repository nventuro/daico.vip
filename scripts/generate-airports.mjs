// =============================================================================
// Write the airports Viajes offers, from the OurAirports dataset.
//
//   npm run airports:generate -- [--from <dir>] [--review <file>]
//
// OurAirports (https://ourairports.com/data/) is public domain and kept by
// volunteers. Every airport of it with an IATA code that is still open gets a
// line in src/apps/viajes/airportList.ts: its code and what it is called —
// its city, and in a parenthesis only what tells it from another entry. How
// that is worked out is in generate-airports/labels.mjs, and what the dataset
// cannot say — a city's own name where it gives the English one, the city an
// airport serves where it gives the suburb the runway is in, what an airport
// is called day to day — is written by hand in generate-airports/names.mjs.
// Each airport's time zone comes from the mwgg/Airports dataset (MIT), as
// generate-airports/zones.mjs works it out.
//
// `--from <dir>` reads airports.csv, regions.csv and airports.json from a
// directory instead of downloading them. `--review <file>` writes a sheet of every airport an
// airline's ticket is normally for — what the dataset says beside what the
// list will read, by country — to look over. The dataset changes under
// volunteers' hands, so the generated file's diff is read before it is kept.
// =============================================================================
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { csvRecords } from './generate-airports/csv.mjs';
import {
  airportsOf,
  isBig,
  isUnbacked,
  labelAirports,
  plainRegion,
} from './generate-airports/labels.mjs';
import { NAMES, REGION_NAMES } from './generate-airports/names.mjs';
import { airportZones, zoneLines } from './generate-airports/zones.mjs';

const SOURCE = 'https://davidmegginson.github.io/ourairports-data/';
const ZONES_SOURCE = 'https://raw.githubusercontent.com/mwgg/Airports/master/';
const OUTPUT = 'src/apps/viajes/airportList.ts';
// The app is in Argentinian Spanish, and so is what a country is called.
const COUNTRY_LOCALE = 'es-AR';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

const args = process.argv.slice(2);
const opt = (name) => {
  const i = args.indexOf(name);
  return i === -1 ? null : args[i + 1];
};
const fromDir = opt('--from');
const reviewFile = opt('--review');

async function read(file, source = SOURCE) {
  if (fromDir) return fs.readFile(path.join(fromDir, file), 'utf8');
  const response = await fetch(source + file);
  if (!response.ok) throw new Error(`${file}: ${response.status}`);
  return response.text();
}

const airports = airportsOf(csvRecords(await read('airports.csv')));
const regions = new Map(csvRecords(await read('regions.csv')).map((r) => [r.code, r.name]));
const countries = new Intl.DisplayNames([COUNTRY_LOCALE], { type: 'region' });
const zones = airportZones(airports, JSON.parse(await read('airports.json', ZONES_SOURCE)));

// The regions a label ended up naming as the dataset calls them, to look over:
// the dataset's names are in English or the region's own language.
const asTheDatasetSays = new Set();
const { entries, problems } = labelAirports(airports, {
  names: NAMES,
  countryName: (code) => countries.of(code),
  regionName: (code) => {
    if (REGION_NAMES[code]) return REGION_NAMES[code];
    if (!regions.has(code)) return null;
    const name = plainRegion(regions.get(code));
    asTheDatasetSays.add(name);
    return name;
  },
});
for (const code of Object.keys(REGION_NAMES)) {
  if (!regions.has(code))
    problems.push(`${code} is named by hand but is not a region of the dataset`);
}
if (problems.length > 0) {
  for (const problem of problems) console.error(problem);
  process.exit(1);
}

const today = new Date().toISOString().slice(0, 10);
const escaped = (lines) => lines.join('\n').replace(/[\\`]|\$\{/g, '\\$&');
const lines = escaped(entries.map((entry) => `${entry.airport.code} ${entry.label}`));
// Only an airport the list writes takes a place among the zones.
const zoned = new Map(
  entries
    .map((entry) => entry.airport.code)
    .filter((code) => zones.has(code))
    .map((code) => [code, zones.get(code)]),
);
await fs.writeFile(
  path.join(root, OUTPUT),
  `// Written by \`npm run airports:generate\` from the OurAirports dataset (public
// domain, https://ourairports.com/data/) and the time zones of the mwgg/Airports
// dataset (MIT, Copyright (c) 2014 mwgg, https://github.com/mwgg/Airports) as
// they stood on ${today}. Never edited by hand: a name that reads wrong is put
// right in the script's names and the file written again.

/** Every airport a ticket can name, a line each: its IATA code, a space, and
 *  what it is called. The ones a ticket is likeliest to name come first. */
export const AIRPORT_LINES = \`${lines}\`;

/** The time zone each airport's clocks keep, a line per zone: its name, and
 *  the codes of its airports after it, a space between each. An airport whose
 *  zone is not known is on no line. */
export const AIRPORT_ZONES = \`${escaped(zoneLines(zoned))}\`;
`,
);

if (reviewFile) {
  const sheet = entries
    .filter((entry) => isBig(entry.airport) || NAMES[entry.airport.code])
    .sort(
      (a, b) =>
        a.airport.country.localeCompare(b.airport.country) ||
        a.airport.code.localeCompare(b.airport.code),
    )
    .map((entry) =>
      [
        entry.airport.country,
        entry.airport.code,
        entry.label,
        entry.airport.municipality,
        entry.airport.name,
        zones.get(entry.airport.code) ?? '',
        NAMES[entry.airport.code] ? 'by hand' : '',
        isUnbacked(entry) ? 'not in the record' : '',
      ].join('\t'),
    );
  await fs.writeFile(
    reviewFile,
    ['country\tcode\treads\tmunicipality\tofficial name\tzone\twritten\tcheck', ...sheet].join(
      '\n',
    ) + '\n',
  );
}

const big = entries.filter((entry) => isBig(entry.airport));
const guessed = big.filter((entry) => entry.parts.includes(entry.name) && !entry.written.name);
console.log(`${entries.length} airports, ${Object.keys(NAMES).length} named by hand`);
console.log(
  `${guessed.length} airports a ticket is normally for carry a short name worked out, not written:`,
);
console.log(guessed.map((entry) => `  ${entry.airport.code} ${entry.label}`).join('\n'));
const unzoned = entries.filter((entry) => !zoned.has(entry.airport.code));
const bigUnzoned = unzoned.filter((entry) => isBig(entry.airport));
console.log(
  `${unzoned.length} airports have no time zone, so no flight of theirs says how long it takes;` +
    ` ${bigUnzoned.length} of them a ticket is normally for:`,
);
console.log(bigUnzoned.map((entry) => `  ${entry.airport.code} ${entry.label}`).join('\n'));
console.log(`${asTheDatasetSays.size} regions are called as the dataset calls them:`);
console.log(`  ${[...asTheDatasetSays].sort().join(', ')}`);
