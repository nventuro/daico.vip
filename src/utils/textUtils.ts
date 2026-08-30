/** What an error can be told as, whatever was thrown. */
export function errorMessage(e: unknown): string {
  return e instanceof Error ? e.message : String(e);
}

/**
 * `text` lower-cased with every accent stripped ("Árbol" → "arbol"). For Latin
 * text each input character maps to exactly one output character, so an index
 * into the result is also an index into `text`.
 */
export function normalize(text: string): string {
  return text.toLowerCase().normalize('NFD').replace(/\p{M}/gu, '');
}

/** `text` with its first character upper-cased. */
export function capitalize(text: string): string {
  return text.charAt(0).toUpperCase() + text.slice(1);
}

/** A number as two digits, e.g. 7 → "07". */
export function pad2(n: number): string {
  return String(n).padStart(2, '0');
}

/** A count with its noun, e.g. "1 guía" / "3 guías" / "0 guías". */
export function countLabel(n: number, singular: string, plural: string): string {
  return `${n} ${n === 1 ? singular : plural}`;
}

/** `text` trimmed and lower-cased: the form titles and item names are saved in,
 *  so entries read the same however they were typed. */
export function lowercaseTrimmed(text: string): string {
  return text.trim().toLowerCase();
}

/** Why a file was refused for its size, in the user's words. */
export function tooLargeMessage(bytes: number, max: number): string {
  return `El archivo pesa ${formatBytes(bytes)}; el máximo es ${formatBytes(max)}.`;
}

const BYTES_PER_UNIT = 1024;
const BYTE_UNITS = ['B', 'KB', 'MB', 'GB'];

/** A byte count as people read it, e.g. "3,4 MB". */
export function formatBytes(bytes: number): string {
  let value = bytes;
  let unit = 0;
  while (value >= BYTES_PER_UNIT && unit < BYTE_UNITS.length - 1) {
    value /= BYTES_PER_UNIT;
    unit += 1;
  }
  const digits = unit === 0 || value >= 100 ? 0 : 1;
  return `${value.toLocaleString('es-AR', { maximumFractionDigits: digits })} ${BYTE_UNITS[unit]}`;
}
