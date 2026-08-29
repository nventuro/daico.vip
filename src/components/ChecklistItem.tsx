import type { CSSProperties, ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { IconChevronRight } from '@tabler/icons-react';
import CheckSquare from './CheckSquare';

interface ChecklistItemProps {
  /** Whether the item is completed (done / bought). */
  checked: boolean;
  label: string;
  /** A second line under the label, e.g. when the entry is due. */
  subtitle?: ReactNode;
  /** Whether the subtitle is about something already past, which is said in
   *  the error colour. */
  overdue?: boolean;
  onToggle: () => void;
  /** What the toggle is called, for whoever cannot see the row. */
  toggleLabel: string;
  /**
   * Where the row opens. When set, only the check square toggles and the rest
   * of the row is a link there (with a chevron saying so); when unset the
   * whole row toggles.
   */
  to?: string;
  /** Small marks shown before the chevron of a linked row (e.g. "has notes"). */
  trailing?: ReactNode;
  /**
   * Whether to draw the check square. Without it, completion reads only as a
   * strike through the label — for a list where the whole row is the toggle
   * and there is nothing else to read on it. A linked row always has its
   * square, since that is its toggle.
   */
  showCheck?: boolean;
  /** Handle a reorderable row is dragged by, leftmost on it. */
  dragHandle?: ReactNode;
  containerRef?: (node: HTMLElement | null) => void;
  style?: CSSProperties;
  /** Whether the row is being dragged, which lifts it off the list. */
  dragging?: boolean;
}

/**
 * A single checklist row, in two shapes:
 * a plain row is one tap target that toggles completion (with an optional
 * drag handle); a row with `to` splits into a check square that toggles and
 * a body that opens the item, so a thumb landing on the text never completes
 * anything by accident.
 */
export default function ChecklistItem({
  checked,
  label,
  subtitle,
  overdue = false,
  onToggle,
  toggleLabel,
  to,
  trailing,
  showCheck = true,
  dragHandle,
  containerRef,
  style,
  dragging = false,
}: ChecklistItemProps) {
  const text = (
    <span className="flex min-w-0 flex-1 flex-col">
      <span className={`truncate ${checked ? 'text-muted line-through' : 'text-on-surface'}`}>
        {label}
      </span>
      {subtitle !== undefined && (
        <span className={`mt-0.5 truncate text-xs ${overdue ? 'text-error' : 'text-muted'}`}>
          {subtitle}
        </span>
      )}
    </span>
  );

  return (
    <li
      ref={containerRef}
      style={style}
      className={`flex items-stretch border-b border-border ${
        dragging ? 'relative z-10 bg-surface shadow-lg' : ''
      }`}
    >
      {dragHandle}
      {to ? (
        <>
          {/* Padded to a target of its own, so it is deliberate to hit. */}
          <button
            onClick={onToggle}
            aria-label={toggleLabel}
            title={toggleLabel}
            className={`flex shrink-0 items-center py-3 pr-3 ${dragHandle ? 'pl-1' : 'pl-0'}`}
          >
            <CheckSquare checked={checked} />
          </button>
          <Link to={to} className="flex min-w-0 flex-1 items-center gap-2 py-3 pl-1">
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
          className={`flex flex-1 items-center gap-3 py-3 text-left ${dragHandle ? 'pl-1' : ''}`}
        >
          {showCheck && <CheckSquare checked={checked} />}
          {text}
        </button>
      )}
    </li>
  );
}
