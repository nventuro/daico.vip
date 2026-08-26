// =============================================================================
// Text matching for search: case- and accent-insensitive, so "noquis" finds
// "Ñoquis". Pure string helpers, shared by every app's search adapter.
// =============================================================================

const ELLIPSIS = '…';

/**
 * `text` lower-cased with every accent stripped ("Árbol" → "arbol"). For Latin
 * text each input character maps to exactly one output character, so an index
 * into the result is also an index into `text`.
 */
export function normalize(text: string): string {
  return text.toLowerCase().normalize('NFD').replace(/\p{M}/gu, '');
}

/** Whether `text` contains `query`, ignoring case and accents. Empty or missing text never matches. */
export function matches(text: string | null | undefined, query: string): boolean {
  if (!text) return false;
  return normalize(text).includes(normalize(query));
}

/**
 * A short window of `text` around its first match of `query`: up to `radius`
 * characters either side, with whitespace runs collapsed to one space and an
 * ellipsis wherever the text was cut. When nothing matches, the head of the
 * text (twice `radius`) instead.
 */
export function excerpt(text: string, query: string, radius: number): string {
  const flat = text.replace(/\s+/g, ' ').trim();
  const needle = normalize(query);
  const at = normalize(flat).indexOf(needle);
  const [start, end] =
    at === -1 ? [0, 2 * radius] : [Math.max(0, at - radius), at + needle.length + radius];
  const head = start > 0 ? ELLIPSIS : '';
  const tail = end < flat.length ? ELLIPSIS : '';
  return `${head}${flat.slice(start, end)}${tail}`;
}
