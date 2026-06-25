import type { ReactNode } from 'react';
import { IconCheck, IconTrash } from '@tabler/icons-react';

interface ChecklistItemProps {
  /** Whether the item is completed (done / bought). */
  checked: boolean;
  /** Primary text shown on the row. */
  label: string;
  /** Optional secondary line under the label (e.g. a due date). */
  subtitle?: ReactNode;
  onToggle: () => void;
  onRemove: () => void;
  /** Accessible label/title for the toggle (whole-row) button. */
  toggleLabel: string;
  /** Accessible label/title for the remove button. */
  removeLabel: string;
}

/** A single checklist row shared by the chores and shopping lists: the whole row
 *  is one tap target that toggles completion, with a separate remove button. */
export default function ChecklistItem({
  checked,
  label,
  subtitle,
  onToggle,
  onRemove,
  toggleLabel,
  removeLabel,
}: ChecklistItemProps) {
  return (
    <li className="flex items-stretch rounded-xl border border-border bg-surface-raised shadow-sm">
      <button
        onClick={onToggle}
        aria-label={toggleLabel}
        title={toggleLabel}
        className="flex flex-1 items-center gap-3 px-3 py-3 text-left"
      >
        <span
          className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2 transition-colors ${
            checked
              ? 'border-primary bg-primary text-on-primary'
              : 'border-neutral-hover text-transparent'
          }`}
        >
          <IconCheck size={14} stroke={3} />
        </span>
        <span className="flex min-w-0 flex-1 flex-col">
          <span
            className={`truncate ${checked ? 'text-muted line-through' : 'text-on-surface'}`}
          >
            {label}
          </span>
          {subtitle}
        </span>
      </button>
      <button
        onClick={onRemove}
        aria-label={removeLabel}
        title={removeLabel}
        className="flex shrink-0 items-center px-3 text-muted transition-colors hover:text-error"
      >
        <IconTrash size={18} stroke={1.5} />
      </button>
    </li>
  );
}
