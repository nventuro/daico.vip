import type { TripItem } from '../../lib/offline/specs';
import { normalize } from '../../utils/textUtils';
import { AIRPORT_LINES } from './airportList';
import { isFlight } from './kinds';

/** How long an IATA code is, and so how much of a line of the list is one. */
const IATA_LENGTH = 3;

/** What an IATA code reads like. */
const IATA_CODE = /^[A-Z]{3}$/;

/** What an option reads once picked: a code, then what the airport is called. */
const PICKED_OPTION = /^[A-Z]{3} — /;

/** How many airports a field offers at once: enough to find the one meant,
 *  and few enough that the list under the field is redrawn on every letter. */
export const AIRPORT_MATCHES_MAX = 50;

/** How much is typed before the list is looked through: one letter is in the
 *  name of thousands of airports, and says nothing of which is meant. */
export const AIRPORT_MATCH_FROM_CHARS = 2;

/** A letter stripping accents leaves as it is, and the plain one typed for it. */
const PLAIN_LETTERS: Record<string, string> = {
  ø: 'o',
  Ø: 'O',
  ł: 'l',
  Ł: 'L',
  đ: 'd',
  Đ: 'D',
  ı: 'i',
  ß: 'ss',
  æ: 'ae',
  Æ: 'Ae',
  œ: 'oe',
  Œ: 'Oe',
};

/** `text` as a keyboard with no accents writes it, capitals kept. */
function unaccented(text: string): string {
  return text
    .normalize('NFD')
    .replace(/\p{M}/gu, '')
    .replace(/[øØłŁđĐıßæÆœŒ]/g, (letter) => PLAIN_LETTERS[letter]);
}

/** What two spellings of a place are the same by. */
function fold(text: string): string {
  return normalize(unaccented(text)).trim();
}

interface Airport {
  code: string;
  /** What the airport is called: its city, and what tells it from another. */
  label: string;
  /** The label, and the code and the label, as they are searched. */
  foldedLabel: string;
  folded: string;
}

interface Airports {
  list: readonly Airport[];
  byCode: ReadonlyMap<string, Airport>;
}

let parsed: Airports | null = null;

/** The bundled list, read the first time it is asked for: it is thousands of
 *  lines, and most openings of the app never show an airport. */
function airports(): Airports {
  if (parsed) return parsed;
  const list = AIRPORT_LINES.split('\n').map((line): Airport => {
    const code = line.slice(0, IATA_LENGTH);
    const label = line.slice(IATA_LENGTH + 1);
    return { code, label, foldedLabel: fold(label), folded: fold(`${code} ${label}`) };
  });
  parsed = { list, byCode: new Map(list.map((airport) => [airport.code, airport])) };
  return parsed;
}

/** Every airport the list knows, as its code and what it is called. */
export function allAirports(): (readonly [string, string])[] {
  return airports().list.map(({ code, label }) => [code, label]);
}

/** An airport as a row names it: its code, then what it is called when the
 *  list knows it — an airport is remembered by where it is, not by three
 *  letters. */
export function airportLabel(code: string): string {
  const airport = airports().byCode.get(code);
  return airport ? `${code} ${airport.label}` : code;
}

/** An airport as its field shows it once chosen: what its option reads. */
export function airportFieldValue(code: string): string {
  return airportOptionValue(code, airports().byCode.get(code)?.label ?? '');
}

/**
 * How an airport is offered: the code first, then what it is called, in one
 * string. Both halves are in the *value* because that is the only part Firefox
 * matches a datalist option by — a `label` never takes part in the filtering
 * there — and the code leads it so a narrow field still shows the half that is
 * being looked for.
 */
export function airportOptionValue(code: string, label: string): string {
  return label ? `${code} — ${label}` : code;
}

/**
 * An option as the field offers it while `typed` is in it. A browser only
 * shows the options that contain the letters as they were typed, accents and
 * all, so an airport found without minding them is written the way it is
 * being typed: «COR — Cordoba» under «cordoba», and as it is called under
 * «córdoba». Either reads back as the same code.
 */
export function airportOptionText(code: string, label: string, typed: string): string {
  const value = airportOptionValue(code, label);
  return value.toLowerCase().includes(typed.trim().toLowerCase()) ? value : unaccented(value);
}

/**
 * The airports the household has already flown through, most used first.
 * Where the household flies is private, so this is read from the device's own
 * rows and never committed.
 */
export function ownAirports(items: readonly TripItem[]): string[] {
  const used = new Map<string, number>();
  for (const item of items.filter(isFlight)) {
    for (const code of [item.origin, item.destination]) {
      // A flight that was written as a train first may still name a station.
      if (code && IATA_CODE.test(code)) used.set(code, (used.get(code) ?? 0) + 1);
    }
  }
  return [...used.entries()]
    .sort(([codeA, timesA], [codeB, timesB]) => timesB - timesA || codeA.localeCompare(codeB))
    .map(([code]) => code);
}

/**
 * The airports to offer under what is `typed`, as code and name. With nothing
 * typed yet, the household's `own`; from there on, whatever the text is part
 * of, accents aside — the household's own first, then the airports it begins
 * the code or the name of, then the ones it begins a word of, each in the
 * list's order, which has the airports a ticket is likeliest to name first.
 */
export function airportMatches(
  typed: string,
  own: readonly string[],
): (readonly [string, string])[] {
  const { list, byCode } = airports();
  const needle = fold(typed);
  if (needle.length < AIRPORT_MATCH_FROM_CHARS) {
    return own.map((code) => [code, byCode.get(code)?.label ?? '']);
  }

  const ownCodes = new Set(own);
  const mine: Airport[] = [];
  const starts: Airport[] = [];
  const startsWord: Airport[] = [];
  const holds: Airport[] = [];
  for (const airport of list) {
    if (!airport.folded.includes(needle)) continue;
    if (ownCodes.has(airport.code)) mine.push(airport);
    else if (airport.folded.startsWith(needle) || airport.foldedLabel.startsWith(needle)) {
      starts.push(airport);
    } else if (airport.folded.includes(` ${needle}`) || airport.folded.includes(`(${needle}`)) {
      startsWord.push(airport);
    } else holds.push(airport);
  }
  mine.sort((a, b) => own.indexOf(a.code) - own.indexOf(b.code));
  return [...mine, ...starts, ...startsWord, ...holds]
    .slice(0, AIRPORT_MATCHES_MAX)
    .map(({ code, label }) => [code, label]);
}

/** The code of an option picked from the list, which drops its whole value
 *  into the field; null for anything typed. */
export function pickedAirportCode(text: string): string | null {
  return PICKED_OPTION.test(text) ? text.slice(0, IATA_LENGTH) : null;
}

/**
 * The code behind whatever is in the field: an option picked from the list, a
 * code typed straight in — three letters are always one, listed or not, since
 * that is all a code ever is — or a name that means one airport and no other:
 * the whole of what one is called, or a part of what only one is. Null for
 * what names none, or could be any of several.
 */
export function resolveAirportCode(text: string): string | null {
  const typed = text.trim();
  const picked = pickedAirportCode(typed);
  if (picked) return picked;
  const asCode = typed.toUpperCase();
  if (IATA_CODE.test(asCode)) return asCode;

  const needle = fold(typed);
  if (!needle) return null;
  const { list } = airports();
  const called = list.filter((airport) => airport.foldedLabel === needle);
  if (called.length === 1) return called[0].code;
  const named = list.filter((airport) => airport.folded.includes(needle));
  return named.length === 1 ? named[0].code : null;
}

/**
 * The code a field holds once what was typed in it is left: none for a field
 * emptied, the airport the text means, and the one it `held` before for text
 * that means none or any of several — an airport is never lost to a word left
 * half written.
 */
export function airportAfterTyping(text: string, held: string | null): string | null {
  if (text.trim() === '') return null;
  return resolveAirportCode(text) ?? held;
}
