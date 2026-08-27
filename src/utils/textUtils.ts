/** A count with its noun, e.g. "1 guía" / "3 guías" / "0 guías". */
export function countLabel(n: number, singular: string, plural: string): string {
  return `${n} ${n === 1 ? singular : plural}`;
}

/** `text` trimmed and lower-cased: the form titles and item names are saved in,
 *  so entries read the same however they were typed. */
export function lowercaseTrimmed(text: string): string {
  return text.trim().toLowerCase();
}
