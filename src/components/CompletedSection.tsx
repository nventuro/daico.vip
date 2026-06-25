import { useState, type ReactNode } from 'react';
import { IconChevronRight } from '@tabler/icons-react';

interface CompletedSectionProps {
  /** Section heading, e.g. "Compradas" / "Hechas". */
  label: string;
  /** Number of completed items (the section hides itself when zero). */
  count: number;
  children: ReactNode;
}

/** Collapsible bottom section that holds completed items so they stay out of the
 *  way without being deleted. Collapsed by default. */
export default function CompletedSection({ label, count, children }: CompletedSectionProps) {
  const [open, setOpen] = useState(false);

  if (count === 0) return null;

  return (
    <div className="mt-6">
      <button
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="flex w-full items-center gap-1.5 py-2 text-sm font-medium text-muted transition-colors hover:text-muted-strong"
      >
        <IconChevronRight
          size={16}
          stroke={2}
          className={`transition-transform ${open ? 'rotate-90' : ''}`}
        />
        {label} ({count})
      </button>
      {open && <ul className="space-y-2">{children}</ul>}
    </div>
  );
}
