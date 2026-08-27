/** A count with its noun, e.g. "1 guía" / "3 guías" / "0 guías". */
export function countLabel(n: number, singular: string, plural: string): string {
  return `${n} ${n === 1 ? singular : plural}`;
}

/** `text` trimmed and lower-cased: the form titles and item names are saved in,
 *  so entries read the same however they were typed. */
export function lowercaseTrimmed(text: string): string {
  return text.trim().toLowerCase();
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
