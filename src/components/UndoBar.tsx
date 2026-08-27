interface UndoBarProps {
  /** What just happened, e.g. "Tarea hecha". */
  message: string;
  actionLabel?: string;
  onAction: () => void;
}

/** A brief notice that something reversible just happened, with the one
 *  action that reverses it. The caller decides how long it stays up. */
export default function UndoBar({ message, actionLabel = 'Deshacer', onAction }: UndoBarProps) {
  return (
    <div
      role="status"
      className="flex items-center justify-between gap-3 bg-surface-inverse px-4 py-2.5 text-sm text-on-surface-inverse shadow-lg"
    >
      <span>{message}</span>
      <button
        type="button"
        onClick={onAction}
        className="font-bold text-accent transition-colors hover:underline"
      >
        {actionLabel}
      </button>
    </div>
  );
}
