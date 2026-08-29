import { useState, type ReactNode } from 'react';
import Button from './Button';
import DialogFooter from './DialogFooter';

interface FormFooterProps {
  /** The destructive action as first offered, e.g. "Eliminar tarea". */
  removeLabel: string;
  /** The question asked before it goes through, e.g. "¿Eliminar la tarea?". */
  confirmQuestion: string;
  onRemove: () => void;
  submitLabel?: string;
  /** Forms pass true until the draft differs from the saved record. */
  submitDisabled?: boolean;
  /** What to show instead of the submit button, for a screen whose main
   *  action is not saving a form (opening or sharing what it shows); `null`
   *  for one whose only action is the destructive one. */
  action?: ReactNode | null;
}

/**
 * The bottom row of an edit form: the record's delete action on the left, the
 * form's submit (or the screen's own `action`) on the right. Deleting takes two
 * taps — the first swaps the row for a confirmation with equal Cancelar /
 * Eliminar pills, so a stray tap on the delete pill can never remove anything.
 */
export default function FormFooter({
  removeLabel,
  confirmQuestion,
  onRemove,
  submitLabel = 'Guardar',
  submitDisabled = false,
  action,
}: FormFooterProps) {
  const [confirming, setConfirming] = useState(false);

  if (confirming) {
    return (
      <div className="flex flex-col gap-2">
        <p className="font-medium text-on-surface">{confirmQuestion}</p>
        <p className="text-sm text-muted">No se puede deshacer.</p>
        <DialogFooter
          onCancel={() => setConfirming(false)}
          onConfirm={onRemove}
          confirmLabel="Eliminar"
          confirmVariant="danger"
        />
      </div>
    );
  }

  return (
    <div className="flex items-center justify-between gap-3">
      <Button variant="dangerOutline" onClick={() => setConfirming(true)}>
        {removeLabel}
      </Button>
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
