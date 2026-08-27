import type { CSSProperties, ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { IconCheck, IconChevronRight } from '@tabler/icons-react';

interface ChecklistItemProps {
  /** Whether the item is completed (done / bought). */
  checked: boolean;
  /** Primary text shown on the row. */
  label: string;
  /** Optional secondary line under the label (e.g. a due date). */
  subtitle?: ReactNode;
  onToggle: () => void;
  /** Accessible label/title for the toggle button. */
  toggleLabel: string;
  /**
   * Where the row opens. When set, only the check circle toggles and the rest
   * of the row is a link there (with a chevron saying so); when unset the
   * whole row toggles.
   */
  to?: string;
  /** Small marks shown before the chevron of a linked row (e.g. "has notes"). */
  trailing?: ReactNode;
  /**
   * Whether to draw the check circle. Without it, completion reads only as a
   * strike through the label — for a list where the whole row is the toggle
   * and there is nothing else to read on it. A linked row always has its
   * circle, since that is its toggle.
   */
  circle?: boolean;
  /** Optional drag handle (reorderable lists), rendered leftmost on the row. */
  dragHandle?: ReactNode;
  /** Ref for the row element, used by drag-and-drop to track it. */
  containerRef?: (node: HTMLElement | null) => void;
  /** Inline style for the row (drag transform / transition). */
  style?: CSSProperties;
  /** Whether the row is currently being dragged (lifts it visually). */
  dragging?: boolean;
}

/**
 * A single checklist row shared by the chores and shopping lists. Two shapes:
 * a plain row is one tap target that toggles completion (with an optional
 * drag handle); a row with `to` splits into a check circle that toggles and
 * a body that opens the item, so a thumb landing on the text never completes
 * anything by accident.
 */
export default function ChecklistItem({
  checked,
  label,
  subtitle,
  onToggle,
  toggleLabel,
  to,
  trailing,
  circle = true,
  dragHandle,
  containerRef,
  style,
  dragging = false,
}: ChecklistItemProps) {
  const check = (
    <span
      className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2 transition-colors ${
        checked
          ? 'border-primary bg-primary text-on-primary'
          : 'border-neutral-hover text-transparent'
      }`}
    >
      <IconCheck size={14} stroke={3} />
    </span>
  );

  const text = (
    <span className="flex min-w-0 flex-1 flex-col">
      <span className={`truncate ${checked ? 'text-muted line-through' : 'text-on-surface'}`}>
        {label}
      </span>
      {subtitle}
    </span>
  );

  return (
    <li
      ref={containerRef}
      style={style}
      className={`flex items-stretch rounded-xl border border-border bg-surface-raised shadow-sm ${
        dragging ? 'relative z-10 shadow-lg' : ''
      }`}
    >
      {dragHandle}
      {to ? (
        <>
          {/* Padded to a 44px-wide target of its own, so it is deliberate to hit. */}
          <button
            onClick={onToggle}
            aria-label={toggleLabel}
            title={toggleLabel}
            className={`flex shrink-0 items-center py-3 pr-2 ${dragHandle ? 'pl-1' : 'pl-3'}`}
          >
            {check}
          </button>
          <Link to={to} className="flex min-w-0 flex-1 items-center gap-2 py-3 pr-2 pl-1">
            {text}
            {trailing}
            <IconChevronRight size={18} stroke={1.5} className="shrink-0 text-muted" />
          </Link>
        </>
      ) : (
        <button
          onClick={onToggle}
          aria-label={toggleLabel}
          title={toggleLabel}
          className={`flex flex-1 items-center gap-3 py-3 text-left ${dragHandle ? 'pr-3' : 'px-3'}`}
        >
          {circle && check}
          {text}
        </button>
      )}
    </li>
  );
}
