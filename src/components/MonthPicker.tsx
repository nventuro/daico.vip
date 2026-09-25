import { useState } from 'react';
import { IconX } from '@tabler/icons-react';
import { monthName, soonestYearOf } from '../utils/dateUtils';
import { CONTROL_CLASS } from './controlClasses';
import IconButton from './IconButton';
import Select from './Select';

/** How many years before the current one the year list starts: a month
 *  already gone, for something found past its date. */
const YEARS_BACK = 1;

/** How many years after the current one it reaches: as far as a package
 *  prints. */
const YEARS_AHEAD = 10;

const MONTHS = Array.from({ length: 12 }, (_, i) => i + 1);

/** A month and its year as yyyy-mm. */
function yearMonth(year: number, month: number): string {
  return `${year}-${String(month).padStart(2, '0')}`;
}

/** Every year from `first` to `last`, both included. */
function yearsFrom(first: number, last: number): number[] {
  return Array.from({ length: last - first + 1 }, (_, i) => first + i);
}

interface MonthPickerProps {
  /** yyyy-mm, or null when no month is chosen. */
  value: string | null;
  onChange: (value: string | null) => void;
  /** yyyy-mm-dd: the day the years offered, and the year of a month picked
   *  first, are counted from. */
  today: string;
}

/**
 * A month with no day: its name and its year as two lists, each the
 * platform's own, and the cross that takes it away. A month picked with no
 * year yet takes its soonest one; a year picked first waits for its month,
 * since a year alone is no date.
 */
export default function MonthPicker({ value, onChange, today }: MonthPickerProps) {
  const [draftYear, setDraftYear] = useState<number | null>(null);
  const [year, month] = value ? value.split('-').map(Number) : [draftYear, null];
  const current = Number(today.slice(0, 4));
  const years = yearsFrom(
    Math.min(current - YEARS_BACK, year ?? current),
    Math.max(current + YEARS_AHEAD, year ?? current),
  );

  function pickMonth(picked: number) {
    onChange(yearMonth(year ?? soonestYearOf(picked, today), picked));
  }

  function pickYear(picked: number) {
    if (month === null) setDraftYear(picked);
    else onChange(yearMonth(picked, month));
  }

  function clear() {
    setDraftYear(null);
    onChange(null);
  }

  return (
    <div className="flex items-center gap-2">
      <Select
        aria-label="Mes"
        value={month ?? ''}
        onChange={(e) => pickMonth(Number(e.target.value))}
        className={`${CONTROL_CLASS} min-w-0 flex-1`}
      >
        <option value="" disabled>
          Mes
        </option>
        {MONTHS.map((option) => (
          <option key={option} value={option}>
            {monthName(yearMonth(current, option), 'long')}
          </option>
        ))}
      </Select>
      <Select
        aria-label="Año"
        value={year ?? ''}
        onChange={(e) => pickYear(Number(e.target.value))}
        className={`${CONTROL_CLASS} w-28`}
      >
        <option value="" disabled>
          Año
        </option>
        {years.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </Select>
      {value !== null && <IconButton label="Quitar fecha" icon={IconX} onClick={clear} />}
    </div>
  );
}
