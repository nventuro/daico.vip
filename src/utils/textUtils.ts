/** A count with its noun, e.g. "1 guía" / "3 guías" / "0 guías". */
export function countLabel(n: number, singular: string, plural: string): string {
  return `${n} ${n === 1 ? singular : plural}`;
}
