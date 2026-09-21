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
//
// `--from <dir>` reads airports.csv and regions.csv from a directory instead
// of downloading them. `--review <file>` writes a sheet of every airport an
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

const SOURCE = 'https://davidmegginson.github.io/ourairports-data/';
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

async function read(file) {
  if (fromDir) return fs.readFile(path.join(fromDir, file), 'utf8');
  const response = await fetch(SOURCE + file);
  if (!response.ok) throw new Error(`${file}: ${response.status}`);
  return response.text();
}

const airports = airportsOf(csvRecords(await read('airports.csv')));
const regions = new Map(csvRecords(await read('regions.csv')).map((r) => [r.code, r.name]));
const countries = new Intl.DisplayNames([COUNTRY_LOCALE], { type: 'region' });

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
const lines = entries
  .map((entry) => `${entry.airport.code} ${entry.label}`)
  .join('\n')
  .replace(/[\\`]|\$\{/g, '\\$&');
await fs.writeFile(
  path.join(root, OUTPUT),
  `// Written by \`npm run airports:generate\` from the OurAirports dataset (public
// domain, https://ourairports.com/data/) as it stood on ${today}. Never edited by
// hand: a name that reads wrong is put right in the script's names and the file
// written again.

/** Every airport a ticket can name, a line each: its IATA code, a space, and
 *  what it is called. The ones a ticket is likeliest to name come first. */
export const AIRPORT_LINES = \`${lines}\`;
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
        NAMES[entry.airport.code] ? 'by hand' : '',
        isUnbacked(entry) ? 'not in the record' : '',
      ].join('\t'),
    );
  await fs.writeFile(
    reviewFile,
    ['country\tcode\treads\tmunicipality\tofficial name\twritten\tcheck', ...sheet].join('\n') +
      '\n',
  );
}

const big = entries.filter((entry) => isBig(entry.airport));
const guessed = big.filter((entry) => entry.parts.includes(entry.name) && !entry.written.name);
console.log(`${entries.length} airports, ${Object.keys(NAMES).length} named by hand`);
console.log(
  `${guessed.length} airports a ticket is normally for carry a short name worked out, not written:`,
);
console.log(guessed.map((entry) => `  ${entry.airport.code} ${entry.label}`).join('\n'));
console.log(`${asTheDatasetSays.size} regions are called as the dataset calls them:`);
console.log(`  ${[...asTheDatasetSays].sort().join(', ')}`);
