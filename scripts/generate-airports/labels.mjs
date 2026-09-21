/** How far apart two airports of one city's name may be and still be that
 *  city's: past it, the same name is another place. */
export const SAME_PLACE_KM = 80;

const EARTH_RADIUS_KM = 6371;

/** Where an airport stands among the others, the busiest kind first. */
const TYPE_ORDER = [
  'large_airport',
  'medium_airport',
  'small_airport',
  'seaplane_base',
  'heliport',
];

/** The kinds of airport an airline's ticket is normally for. */
const BIG_TYPES = new Set(['large_airport', 'medium_airport']);

/** The words of an official name that say only that it is an airport. */
const GENERIC_WORDS =
  /(^|[\s-])(international|intl\.?|int'l|regional|municipal|airport|aeropuerto|aeroporto|aéroport|airfield|air ?base|air ?port|airstrip|aerodrome|flughafen|county|memorial|field)(?=$|[\s-])/gi;

/** A letter `normalize('NFD')` leaves as it is, and the plain one it stands for. */
const PLAIN_LETTERS = { ø: 'o', ł: 'l', đ: 'd', ı: 'i', ß: 'ss', æ: 'ae', œ: 'oe' };

/** `text` lower-cased and without its accents: what two names are the same by. */
export function fold(text) {
  return text
    .normalize('NFD')
    .replace(/\p{M}/gu, '')
    .toLowerCase()
    .replace(/[øłđıßæœ]/g, (letter) => PLAIN_LETTERS[letter])
    .trim();
}

/**
 * The airports of the dataset's records that a ticket can name: the ones with
 * an IATA code that are still open, one per code.
 */
export function airportsOf(records) {
  const airports = new Map();
  for (const record of records) {
    const code = record.iata_code.trim().toUpperCase();
    if (!/^[A-Z]{3}$/.test(code) || record.type === 'closed' || airports.has(code)) continue;
    airports.set(code, {
      code,
      type: record.type,
      name: record.name.trim(),
      municipality: record.municipality.trim(),
      country: record.iso_country,
      region: record.iso_region,
      scheduled: record.scheduled_service === 'yes',
      latitude: Number(record.latitude_deg),
      longitude: Number(record.longitude_deg),
      keywords: record.keywords,
    });
  }
  return [...airports.values()];
}

/** Whether an airline's ticket is normally for this airport. */
export function isBig(airport) {
  return airport.scheduled && BIG_TYPES.has(airport.type);
}

/** Orders airports by how likely one is to be on a ticket, then by code. */
export function byTraffic(a, b) {
  return rank(a) - rank(b) || a.code.localeCompare(b.code);
}

function rank(airport) {
  const type = TYPE_ORDER.indexOf(airport.type);
  return (airport.scheduled ? 0 : TYPE_ORDER.length) + (type === -1 ? TYPE_ORDER.length : type);
}

function kmBetween(a, b) {
  const rad = Math.PI / 180;
  const dLat = (b.latitude - a.latitude) * rad;
  const dLon = (b.longitude - a.longitude) * rad;
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(a.latitude * rad) * Math.cos(b.latitude * rad) * Math.sin(dLon / 2) ** 2;
  return 2 * EARTH_RADIUS_KM * Math.asin(Math.sqrt(h));
}

/**
 * The dataset's municipality as a city's name. It often goes on to say which
 * district or county, in a parenthesis or after a comma, or names a second
 * town after a slash; and it is often typed without the accents the official
 * name spells the same word with.
 */
export function cleanCity(municipality, officialName = '') {
  const city = municipality
    .replace(/\s*\(.*$/, '')
    .replace(/\s*[,/].*$/, '')
    .trim();
  const spelled = officialName.split(/[\s/–—-]+/);
  return city
    .split(' ')
    .map(
      (word) =>
        spelled.find(
          (other) =>
            other !== word && fold(other) === fold(word) && other.normalize('NFD') !== other,
        ) ?? word,
    )
    .join(' ');
}

/**
 * What an airport is called beside its city's name: the official name up to
 * its first dash or slash that says something, without the city and without
 * the words that only say it is an airport. When nothing is left, that it is
 * the international one, or else its code.
 */
export function shortName(airport, city) {
  // «de» is a city's word in «Juiz de Fora» and the airport's own in
  // «Francisco de Assis»: only a word long enough to be a name is the city's.
  const cityWords = new Set(
    city
      .split(/[\s-]+/)
      .filter((word) => word.length > 2)
      .map(fold),
  );
  // A parenthesis in an official name is an aside, and one inside the label's
  // own would not read.
  const official = airport.name.replace(/\s*\([^)]*\)/g, '');
  const parts = official.split(/\s*[–—/]\s*|\s+-\s+/).map((part) => {
    const text = part
      .replace(GENERIC_WORDS, '$1')
      .replace(/[^\s-]+/g, (word) => (cityWords.has(fold(word)) ? '' : word));
    return text.replace(/\s+/g, ' ').replace(/^[\s-]+|[\s-]+$/g, '');
  });
  const said = parts.find((part) => part !== '');
  // «Dubai International Airport» is called just that beside the city's others.
  return said ?? (/\binternational\b/i.test(official) ? 'International' : airport.code);
}

/** What kind of region it is, which the dataset often ends a region's name with
 *  and a label has no room for. */
const REGION_KIND =
  /\s+(Province|Autonomous Region|Municipality|Prefecture|County|Region|District|Department)$/i;

/** A region as a label names it: the dataset's name without its kind. */
export function plainRegion(name) {
  return name.replace(REGION_KIND, '');
}

/**
 * The airports of one name that are one place's, a list per place, the busiest
 * first: the ones that stand near each other, and the ones of one region
 * however far apart — there the name is a district's, and its airports are
 * told apart the way a city's are.
 */
function placesOf(airports) {
  const places = [];
  for (const airport of [...airports].sort(byTraffic)) {
    const near = places.find((place) =>
      place.some(
        (other) => other.region === airport.region || kmBetween(airport, other) < SAME_PLACE_KM,
      ),
    );
    if (near) near.push(airport);
    else places.push([airport]);
  }
  return places;
}

/**
 * What each airport is called: its city, then in a parenthesis only what
 * tells it from another entry — the airport's own name where its city has
 * several, the country (or the region, inside one country) where the city's
 * name is also another place's.
 *
 * `names` is what was written by hand, by code: `city` in place of the
 * dataset's municipality and `name` in place of the short name worked out
 * from the official one. A parenthesis is never written by hand, so no entry
 * can go without the one it needs.
 *
 * Returns the entries, the busiest first, and the `problems` that make the
 * result unfit to write.
 */
export function labelAirports(airports, { names, countryName, regionName }) {
  const problems = [];
  const known = new Set(airports.map((airport) => airport.code));
  for (const code of Object.keys(names)) {
    if (!known.has(code)) problems.push(`${code} is named by hand but is not in the dataset`);
  }

  const entries = airports.map((airport) => {
    const written = names[airport.code] ?? {};
    const city =
      written.city ?? (cleanCity(airport.municipality, airport.name) || shortName(airport, ''));
    return { airport, city, written, name: written.name ?? shortName(airport, city), parts: [] };
  });

  const byCity = new Map();
  for (const entry of entries) {
    const key = fold(entry.city);
    byCity.set(key, [...(byCity.get(key) ?? []), entry]);
  }

  for (const sameName of byCity.values()) {
    const entryOf = new Map(sameName.map((entry) => [entry.airport, entry]));
    const places = placesOf(sameName.map((entry) => entry.airport)).map((place) =>
      place.map((airport) => entryOf.get(airport)),
    );

    for (const place of places) {
      if (place.length === 1) continue;
      // One place is spelled one way: the way its busiest airport spells it.
      for (const entry of place) entry.city = place[0].city;
      // An airport busier than every other of its city is the city's: it is
      // the others that need telling apart from it.
      const [first, second] = place;
      const plain =
        isBig(first.airport) && rank(first.airport) < rank(second.airport) ? first : null;
      for (const entry of place) {
        if (entry !== plain) entry.parts.push(entry.name);
      }
    }

    if (places.length === 1) continue;
    // A place no airline flies to never makes the ones they do fly to explain
    // themselves; between places they do fly to, none is the default.
    const flownTo = places.filter((place) => place.some((entry) => entry.airport.scheduled));
    const explained = places.filter((place) => flownTo.length > 1 || !flownTo.includes(place));
    for (const place of explained) {
      const { country, region } = place[0].airport;
      const abroad = explained.every(
        (other) => other === place || other[0].airport.country !== country,
      );
      const where = abroad ? countryName(country) : (regionName(region) ?? countryName(country));
      for (const entry of place) entry.parts.push(where);
    }
  }

  const label = (entry) =>
    entry.parts.length > 0 ? `${entry.city} (${entry.parts.join(', ')})` : entry.city;

  // Two places of one name in one region, or two airports whose short names
  // are the same, still read alike: the name, then the code, settles it.
  for (const lastResort of [(entry) => entry.name, (entry) => entry.airport.code]) {
    const byLabel = new Map();
    for (const entry of entries) {
      const key = fold(label(entry));
      byLabel.set(key, [...(byLabel.get(key) ?? []), entry]);
    }
    for (const alike of byLabel.values()) {
      if (alike.length === 1) continue;
      for (const entry of alike) {
        const part = lastResort(entry);
        if (!entry.parts.includes(part)) entry.parts.unshift(part);
      }
    }
  }

  const seen = new Map();
  for (const entry of entries) {
    entry.label = label(entry);
    const key = fold(entry.label);
    if (seen.has(key)) {
      problems.push(`${seen.get(key)} and ${entry.airport.code} both read «${entry.label}»`);
    }
    seen.set(key, entry.airport.code);
    if (/[\n\r]/.test(entry.label))
      problems.push(`${entry.airport.code} has a line break in its name`);
  }

  entries.sort((a, b) => byTraffic(a.airport, b.airport));
  return { entries, problems };
}

/** Whether what was written by hand for an entry appears nowhere in its
 *  record — a name put on the wrong code reads like this, and so does a city's
 *  own name where the dataset only has the English one. */
export function isUnbacked(entry) {
  const { airport, written } = entry;
  const record = fold(`${airport.name} ${airport.municipality} ${airport.keywords}`);
  return [written.city, written.name].some(
    (text) => text !== undefined && !record.includes(fold(text)),
  );
}
