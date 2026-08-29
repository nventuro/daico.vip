import type { ButtonHTMLAttributes, ReactNode } from 'react';
import { CHIP_BASE_CLASS, CHIP_IDLE_CLASS, CHIP_SELECTED_CLASS } from './controlClasses';

interface ChipProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  /** Whether this chip is the chosen option of its row. */
  selected: boolean;
}

/** One option in a row of pill choices (a quick date, a filter). Reports its
 *  state as `aria-pressed`; the row decides what a tap means. */
export default function Chip({ selected, className = '', ...rest }: ChipProps) {
  return (
    <button
      type="button"
      aria-pressed={selected}
      className={`${CHIP_BASE_CLASS} ${selected ? CHIP_SELECTED_CLASS : `${CHIP_IDLE_CLASS} hover:text-muted-strong`} transition-colors ${className}`}
      {...rest}
    />
  );
}

/** A chip that only says something (how long a recipe takes, how many it
 *  feeds): the same pill, with nothing to tap. */
export function StaticChip({ children }: { children: ReactNode }) {
  return <span className={`${CHIP_BASE_CLASS} ${CHIP_IDLE_CLASS}`}>{children}</span>;
}
