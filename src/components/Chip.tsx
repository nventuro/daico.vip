import type { ButtonHTMLAttributes, ReactNode, SelectHTMLAttributes } from 'react';
import { IconChevronDown } from '@tabler/icons-react';
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

/** A choice drawn as a chip: the platform's picker opens on the tap, and the
 *  chip reads the option chosen. Any `<select>` attribute passes through. */
export function ChipSelect({ className = '', ...rest }: SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <span className="relative inline-flex">
      <select
        className={`${CHIP_BASE_CLASS} ${CHIP_IDLE_CLASS} appearance-none pr-7 transition-colors outline-none focus:border-primary ${className}`}
        {...rest}
      />
      <IconChevronDown
        size={14}
        stroke={1.5}
        aria-hidden
        className="pointer-events-none absolute top-1/2 right-2 -translate-y-1/2"
      />
    </span>
  );
}
