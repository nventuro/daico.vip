import type { ReactNode } from 'react';

interface DeltaProps {
  /** The change against an earlier period; only its sign matters here. */
  value: number;
  className?: string;
  children: ReactNode;
}

/** A change written beside an amount, tinted red when spending went up and
 *  green when it did not. */
export default function Delta({ value, className = '', children }: DeltaProps) {
  const tone = value > 0 ? 'text-error-subtle' : 'text-success-subtle';
  return <span className={`${tone} tabular-nums ${className}`}>{children}</span>;
}
