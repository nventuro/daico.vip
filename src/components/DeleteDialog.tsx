import DialogFooter from './DialogFooter';
import ModalDialog from './ModalDialog';

interface DeleteDialogProps {
  open: boolean;
  /** What is asked, e.g. "¿Eliminar la nota?". */
  question: string;
  confirmLabel?: string;
  onCancel: () => void;
  onConfirm: () => void;
}

/** The question asked before an entry goes for good: a delete is confirmed
 *  here or not at all, and never taken back afterwards. */
export default function DeleteDialog({
  open,
  question,
  confirmLabel = 'Eliminar',
  onCancel,
  onConfirm,
}: DeleteDialogProps) {
  if (!open) return null;
  return (
    <ModalDialog onClose={onCancel} layout="confirm">
      <div className="flex flex-col gap-2">
        <p className="font-medium text-on-surface">{question}</p>
        <p className="text-sm text-muted">No se puede deshacer.</p>
        <DialogFooter
          onCancel={onCancel}
          onConfirm={onConfirm}
          confirmLabel={confirmLabel}
          confirmVariant="danger"
        />
      </div>
    </ModalDialog>
  );
}
