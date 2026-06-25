import type { CSSProperties, ReactNode } from 'react';
import { IconCheck, IconX } from '@tabler/icons-react';

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
  /** Optional drag handle (reorderable lists), rendered leftmost on the row. */
  dragHandle?: ReactNode;
  /** Ref for the row element, used by drag-and-drop to track it. */
  containerRef?: (node: HTMLElement | null) => void;
  /** Inline style for the row (drag transform / transition). */
  style?: CSSProperties;
  /** Whether the row is currently being dragged (lifts it visually). */
  dragging?: boolean;
}

/** A single checklist row shared by the chores and shopping lists: the whole row
 *  is one tap target that toggles completion, with a separate remove button and
 *  an optional drag handle for manual ordering. */
export default function ChecklistItem({
  checked,
  label,
  subtitle,
  onToggle,
  onRemove,
  toggleLabel,
  removeLabel,
  dragHandle,
  containerRef,
  style,
  dragging = false,
}: ChecklistItemProps) {
  return (
    <li
      ref={containerRef}
      style={style}
      className={`flex items-stretch rounded-xl border border-border bg-surface-raised shadow-sm ${
        dragging ? 'relative z-10 shadow-lg' : ''
      }`}
    >
      {dragHandle}
      <button
        onClick={onToggle}
        aria-label={toggleLabel}
        title={toggleLabel}
        className={`flex flex-1 items-center gap-3 py-3 text-left ${dragHandle ? 'pr-3' : 'px-3'}`}
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
        <IconX size={18} stroke={1.5} />
      </button>
    </li>
  );
}
