import type { ReactNode } from 'react';
import { IconChevronRight } from '@tabler/icons-react';
import { useOpenedHere } from '../hooks/useOpenedHere';

interface CompletedSectionProps {
  /** Section heading, e.g. "Compradas" / "Hechas". */
  label: string;
  /** Number of completed items; the section hides itself when zero. */
  count: number;
  children: ReactNode;
}

/** Collapsible bottom section that holds completed items so they stay out of the
 *  way without being deleted. Collapsed by default; the heading names the section
 *  without counting it, since how many are done changes nothing. What it holds
 *  is the caller's: a list of rows, or the same sections as above it. Opened,
 *  it stays open when its screen is come back to, and a screen reached anew
 *  finds it collapsed. */
export default function CompletedSection({ label, count, children }: CompletedSectionProps) {
  const { isOpen, toggle } = useOpenedHere('completed');
  const open = isOpen(label);

  if (count === 0) return null;

  return (
    <div className="mt-6">
      <button
        type="button"
        onClick={() => toggle(label)}
        aria-expanded={open}
        className="flex w-full items-center gap-1.5 py-2 text-sm font-medium text-muted transition-colors hover:text-muted-strong"
      >
        <IconChevronRight
          size={16}
          stroke={2}
          className={`transition-transform ${open ? 'rotate-90' : ''}`}
        />
        {label}
      </button>
      {open && children}
    </div>
  );
}
