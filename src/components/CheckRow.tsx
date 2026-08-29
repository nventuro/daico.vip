import type { ReactNode } from 'react';
import CheckSquare from './CheckSquare';

interface CheckRowProps {
  checked: boolean;
  onToggle: () => void;
  /** What is being marked; the whole row is the control. */
  children: ReactNode;
  className?: string;
}

/** A row that is one check: a square and what it means, marked or unmarked by
 *  tapping anywhere on it. */
export default function CheckRow({ checked, onToggle, children, className = '' }: CheckRowProps) {
  return (
    <button
      type="button"
      onClick={onToggle}
      aria-pressed={checked}
      className={`flex items-center gap-3 text-left ${className}`}
    >
      <CheckSquare checked={checked} />
      {children}
    </button>
  );
}
