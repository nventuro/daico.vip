import type { ReactNode } from 'react';

interface DeltaProps {
  /** The change against an earlier period; only its sign matters here. */
  value: number;
  className?: string;
  children: ReactNode;
}

/** A change written beside an amount, tinted green when spending went down
 *  and red when it went up; a change of nothing stays muted. */
export default function Delta({ value, className = '', children }: DeltaProps) {
  const tone = value < 0 ? 'text-success-subtle' : value > 0 ? 'text-error-subtle' : 'text-muted';
  return <span className={`${tone} tabular-nums ${className}`}>{children}</span>;
}
