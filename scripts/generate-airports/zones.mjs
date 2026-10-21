// =============================================================================
// The time zone each airport's clocks keep: what turns a pasaje's two local
// hours into how long it takes. OurAirports has no zone; the mwgg/Airports
// dataset has one for most airports, under the airport's ICAO code.
// =============================================================================

/** The name a zone is known by to the runtime, which takes an old name and
 *  a new one for the same zone; null for a name it does not know. */
function canonical(zone) {
  try {
    return new Intl.DateTimeFormat('en', { timeZone: zone }).resolvedOptions().timeZone;
  } catch {
    return null;
  }
}

/** Whichever of `names` comes up most, the first in order on a tie. */
function mostCommon(names) {
  const counts = new Map();
  for (const name of names) counts.set(name, (counts.get(name) ?? 0) + 1);
  return [...counts.entries()].sort(([a, x], [b, y]) => y - x || a.localeCompare(b))[0][0];
}

/** The one zone each country keeps all its airports in, by country code, for
 *  the countries that keep only one; a country across several has none. */
function countryZones(entries) {
  const byCountry = new Map();
  for (const entry of entries) {
    if (!byCountry.has(entry.country)) byCountry.set(entry.country, []);
    byCountry.get(entry.country).push(entry.tz);
  }
  const zones = new Map();
  for (const [country, names] of byCountry) {
    if (new Set(names.map(canonical)).size === 1) zones.set(country, mostCommon(names));
  }
  return zones;
}

/**
 * The zone of each of `airports`, by IATA code, from the `dataset`'s entries
 * as mwgg/Airports writes them: the same airport's — found by one of the
 * codes it goes by, or by its IATA code when the dataset has that code in the
 * same country, since a code is given to another airport over the years — or,
 * for an airport the dataset lacks, its country's, when the country keeps one
 * time. An airport left with none is left out, and so is a zone the runtime
 * does not know.
 */
export function airportZones(airports, dataset) {
  const entries = Object.values(dataset).filter(
    (entry) => entry.tz && entry.country && canonical(entry.tz) !== null,
  );
  const byIdent = new Map(entries.map((entry) => [entry.icao, entry]));
  const byIata = new Map(entries.filter((entry) => entry.iata).map((entry) => [entry.iata, entry]));
  const ofCountry = countryZones(entries);

  const zones = new Map();
  for (const airport of airports) {
    const same =
      airport.idents.map((ident) => byIdent.get(ident)).find((entry) => entry !== undefined) ??
      (byIata.get(airport.code)?.country === airport.country
        ? byIata.get(airport.code)
        : undefined);
    const zone = same?.tz ?? ofCountry.get(airport.country);
    if (zone !== undefined) zones.set(airport.code, zone);
  }
  return zones;
}

/** The zones as the list writes them: a line per zone, its name and then the
 *  codes of its airports, the zones and the codes each in order. */
export function zoneLines(zones) {
  const byZone = new Map();
  for (const [code, zone] of zones) {
    if (!byZone.has(zone)) byZone.set(zone, []);
    byZone.get(zone).push(code);
  }
  return [...byZone.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([zone, codes]) => [zone, ...codes.sort()].join(' '));
}
