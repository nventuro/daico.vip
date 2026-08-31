import { IconX } from '@tabler/icons-react';
import { formatTime } from '../utils/dateUtils';
import { CONTROL_CLASS } from './controlClasses';
import NativeTimePicker from './NativeTimePicker';

interface TimePickerProps {
  /** HH:MM, or null when no hour is chosen. */
  value: string | null;
  onChange: (value: string | null) => void;
  /** Accessible name of the control, e.g. "Salida". */
  label: string;
  /** When set the hour can be changed but never removed. */
  required?: boolean;
  /** The look of the control; a form control unless given. */
  className?: string;
}

/** An hour field that reads on the 24-hour clock whatever the browser's
 *  language: a tap opens the browser's picker, the control shows the hour. */
export default function TimePicker({
  value,
  onChange,
  label,
  required = false,
  className = CONTROL_CLASS,
}: TimePickerProps) {
  return (
    <NativeTimePicker value={value} onChange={onChange} label={label} required={required}>
      {(open) => (
        <span className={`flex items-center gap-2 focus-within:border-primary ${className}`}>
          <button
            type="button"
            onClick={open}
            aria-label={label}
            className="flex-1 text-left outline-none"
          >
            {value ? formatTime(value) : <span className="text-muted">Sin hora</span>}
          </button>
          {!required && value && (
            <button
              type="button"
              onClick={() => onChange(null)}
              aria-label="Quitar hora"
              title="Quitar hora"
              className="text-muted transition-colors hover:text-muted-strong"
            >
              <IconX size={18} stroke={1.5} />
            </button>
          )}
        </span>
      )}
    </NativeTimePicker>
  );
}
