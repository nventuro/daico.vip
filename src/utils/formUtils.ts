/**
 * Whether saving `draft` would change anything: true when any field of the
 * draft differs from the same field on `saved`. Compare the draft in its
 * to-be-saved form (trimmed, nulls for blanks) so cosmetic edits don't count.
 */
export function hasChanges<T extends object>(draft: T, saved: { [K in keyof T]: T[K] }): boolean {
  return (Object.keys(draft) as (keyof T)[]).some((key) => draft[key] !== saved[key]);
}
