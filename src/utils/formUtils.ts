import type { FormEvent } from 'react';

/**
 * Whether saving `draft` would change anything: true when any field of the
 * draft differs from the same field on `saved`. Compare the draft in its
 * to-be-saved form (trimmed, nulls for blanks) so cosmetic edits don't count.
 */
export function hasChanges<T extends object>(draft: T, saved: { [K in keyof T]: T[K] }): boolean {
  return (Object.keys(draft) as (keyof T)[]).some((key) => draft[key] !== saved[key]);
}

/**
 * The half of an edit form that is the same in every one: whether the draft is
 * worth saving — it is complete, and it differs from what is stored — and the
 * submit that saves it. The fields themselves stay the form's own.
 */
export function entryForm<Input extends object>(
  input: Input,
  entry: { [K in keyof Input]: Input[K] },
  onSave: (input: Input) => void,
  /** Whether the draft is complete; a form with only optional fields is. */
  complete = true,
) {
  const canSave = complete && hasChanges(input, entry);

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (canSave) onSave(input);
  }

  return { canSave, onSubmit };
}
