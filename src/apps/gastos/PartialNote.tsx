import { useState } from 'react';

/**
 * What stands where a month's change against the month before it would go,
 * when there is none to write: a month the statements do not cover whole has
 * nothing it can honestly be compared with, and nothing is ever guessed for
 * the days no statement covers. The dash says the month is short; asked, it
 * says which card is missing.
 */
export default function PartialNote({ reason }: { reason: string }) {
  const [open, setOpen] = useState(false);
  return (
    <span className="relative flex w-14 shrink-0 items-center justify-end">
      <button
        type="button"
        onClick={() => setOpen((was) => !was)}
        onBlur={() => setOpen(false)}
        aria-expanded={open}
        aria-label="Mes incompleto"
        title={reason}
        className={`px-2 py-1 text-xs tabular-nums transition-colors ${
          open ? 'text-on-surface' : 'text-muted'
        }`}
      >
        —
      </button>
      {open && (
        <span
          role="status"
          className="absolute top-full right-0 z-10 w-56 bg-surface-inverse px-2.5 py-1.5 text-left text-xs text-on-surface-inverse"
        >
          {reason}
        </span>
      )}
    </span>
  );
}
