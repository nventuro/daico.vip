import type { ReactNode } from 'react';
import SectionLabel from './SectionLabel';

interface LaterSectionProps {
  /** Number of items not yet due; the section hides itself when zero. */
  count: number;
  /** Whether the rows due now are listed above it. Only then is it headed
   *  «Más adelante»: with nothing above, the list is these rows alone, and a
   *  heading would say they are later than nothing. */
  headed: boolean;
  children: ReactNode;
}

/** The rows of a list that are not yet due, under the ones that are. */
export default function LaterSection({ count, headed, children }: LaterSectionProps) {
  if (count === 0) return null;
  if (!headed) return children;

  return (
    <section className="mt-6">
      <SectionLabel>Más adelante</SectionLabel>
      {children}
    </section>
  );
}
