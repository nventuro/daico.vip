import { useRef } from 'react';
import { IconCalendarEvent } from '@tabler/icons-react';
import Chip from '../../components/Chip';
import { addDays, relativeDay } from '../../utils/dateUtils';

interface DueDateChipsProps {
  /** yyyy-mm-dd, or null for no due date. */
  value: string | null;
  onChange: (value: string | null) => void;
  /** yyyy-mm-dd; the day the chips are relative to. */
  today: string;
}

/**
 * A due date as one tap: Hoy, Mañana, Sin fecha, or a calendar chip that opens
 * the native picker for any other day and then reads as that day. Used by the
 * add bar and the task form alike, so a date is chosen the same way everywhere.
 */
export default function DueDateChips({ value, onChange, today }: DueDateChipsProps) {
  const pickerRef = useRef<HTMLInputElement>(null);
  const tomorrow = addDays(today, 1);
  const other = value != null && value !== today && value !== tomorrow;

  function openPicker() {
    const input = pickerRef.current;
    if (!input) return;
    try {
      input.showPicker();
    } catch {
      // Older engines without showPicker(): focusing the input still lets the
      // date be typed.
      input.focus();
    }
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <Chip selected={value === today} onClick={() => onChange(today)}>
        Hoy
      </Chip>
      <Chip selected={value === tomorrow} onClick={() => onChange(tomorrow)}>
        Mañana
      </Chip>
      <Chip selected={value === null} onClick={() => onChange(null)}>
        Sin fecha
      </Chip>
      <Chip selected={other} onClick={openPicker} aria-label="Elegir fecha" title="Elegir fecha">
        <IconCalendarEvent size={16} stroke={1.5} />
        {other && relativeDay(today, value)}
      </Chip>
      {/* The chips are the visible control; this input only carries the native picker. */}
      <input
        ref={pickerRef}
        type="date"
        value={value ?? ''}
        onChange={(e) => onChange(e.target.value || null)}
        aria-label="Fecha"
        tabIndex={-1}
        className="sr-only"
      />
    </div>
  );
}
