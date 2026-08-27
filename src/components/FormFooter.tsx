import { useState } from 'react';
import Button from './Button';

interface FormFooterProps {
  /** The destructive action as first offered, e.g. "Eliminar tarea". */
  removeLabel: string;
  /** The question asked before it goes through, e.g. "¿Eliminar la tarea?". */
  confirmQuestion: string;
  onRemove: () => void;
  submitLabel?: string;
  submitDisabled?: boolean;
}

/**
 * The bottom row of an edit form: the record's delete action on the left, the
 * form's submit on the right. Deleting takes two taps — the first swaps the
 * row for a confirmation with equal Cancelar / Eliminar pills, so a stray tap
 * on the quiet red text can never remove anything.
 */
export default function FormFooter({
  removeLabel,
  confirmQuestion,
  onRemove,
  submitLabel = 'Guardar',
  submitDisabled = false,
}: FormFooterProps) {
  const [confirming, setConfirming] = useState(false);

  if (confirming) {
    return (
      <div className="flex flex-col gap-2">
        <p className="font-medium text-on-surface">{confirmQuestion}</p>
        <p className="text-sm text-muted">No se puede deshacer.</p>
        <div className="mt-1 flex gap-2">
          <Button variant="outline" className="flex-1" onClick={() => setConfirming(false)}>
            Cancelar
          </Button>
          <Button variant="danger" className="flex-1" onClick={onRemove}>
            Eliminar
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-between gap-3">
      <Button variant="dangerText" size="sm" onClick={() => setConfirming(true)}>
        {removeLabel}
      </Button>
      <Button type="submit" disabled={submitDisabled}>
        {submitLabel}
      </Button>
    </div>
  );
}
