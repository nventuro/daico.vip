import type { ReactNode } from 'react';
import Button from './Button';

interface FormFooterProps {
  submitLabel?: string;
  /** Forms pass true until the draft is complete. */
  submitDisabled?: boolean;
  /** What to show instead of the submit button, for a screen whose main
   *  action is not saving a form (opening or sharing what it shows). */
  action?: ReactNode;
}

/** The bottom row of a creation form: its submit at the right, or the
 *  screen's own `action`. No delete is ever here — an entry is deleted from
 *  its page, through `DeleteDialog`. */
export default function FormFooter({
  submitLabel = 'Guardar',
  submitDisabled = false,
  action,
}: FormFooterProps) {
  return (
    <div className="flex items-center justify-end gap-3">
      {action === undefined ? (
        <Button type="submit" disabled={submitDisabled}>
          {submitLabel}
        </Button>
      ) : (
        action
      )}
    </div>
  );
}
