import Button, { type ButtonVariant } from './Button';

interface DialogFooterProps {
  /** The way out, always on the left and always the same weight as the way on. */
  onCancel: () => void;
  cancelLabel?: string;
  /** Set while the dialog is doing what it was told: there is no going back
   *  from a write already on its way. */
  cancelDisabled?: boolean;
  /** What the dialog is for; `submit` leaves it to the form it sits in. */
  onConfirm?: () => void;
  confirmLabel: string;
  confirmVariant?: ButtonVariant;
  confirmDisabled?: boolean;
  submit?: boolean;
}

/** The two buttons a dialog ends in, of equal width: nothing is ever confirmed
 *  by a tap that could have been meant for the way out. */
export default function DialogFooter({
  onCancel,
  cancelLabel = 'Cancelar',
  cancelDisabled = false,
  onConfirm,
  confirmLabel,
  confirmVariant = 'primary',
  confirmDisabled = false,
  submit = false,
}: DialogFooterProps) {
  return (
    <div className="mt-1 flex gap-2">
      <Button variant="outline" className="flex-1" onClick={onCancel} disabled={cancelDisabled}>
        {cancelLabel}
      </Button>
      <Button
        type={submit ? 'submit' : 'button'}
        variant={confirmVariant}
        className="flex-1"
        onClick={onConfirm}
        disabled={confirmDisabled}
      >
        {confirmLabel}
      </Button>
    </div>
  );
}
