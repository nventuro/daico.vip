import { IconCalendarEvent } from '@tabler/icons-react';
import Chip from '../../components/Chip';
import NativeDatePicker from '../../components/NativeDatePicker';
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
  const tomorrow = addDays(today, 1);
  const other = value != null && value !== today && value !== tomorrow;

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
      <NativeDatePicker value={value} onChange={onChange} label="Fecha">
        {(open) => (
          <Chip selected={other} onClick={open} aria-label="Elegir fecha" title="Elegir fecha">
            <IconCalendarEvent size={16} stroke={1.5} />
            {other && relativeDay(today, value)}
          </Chip>
        )}
      </NativeDatePicker>
    </div>
  );
}
