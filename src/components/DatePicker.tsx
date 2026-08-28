import { IconX } from '@tabler/icons-react';
import { formatDateShort } from '../utils/dateUtils';
import { CONTROL_CLASS } from './controlClasses';
import NativeDatePicker from './NativeDatePicker';

interface DatePickerProps {
  /** yyyy-mm-dd, or null when no date is chosen. */
  value: string | null;
  onChange: (value: string | null) => void;
  /** Accessible name of the control, e.g. "Vence". */
  label: string;
  /** When set the date can be changed but never removed. */
  required?: boolean;
  /** The look of the control; a form control unless given. */
  className?: string;
}

/** A date field that reads dd/mm/yyyy whatever the browser's language: a tap
 *  opens the browser's picker, the control shows the chosen day. */
export default function DatePicker({
  value,
  onChange,
  label,
  required = false,
  className = CONTROL_CLASS,
}: DatePickerProps) {
  return (
    <NativeDatePicker value={value} onChange={onChange} label={label} required={required}>
      {(open) => (
        <span className={`flex items-center gap-2 focus-within:border-primary ${className}`}>
          <button
            type="button"
            onClick={open}
            aria-label={label}
            className="flex-1 text-left outline-none"
          >
            {value ? formatDateShort(value) : <span className="text-muted">Sin fecha</span>}
          </button>
          {!required && value && (
            <button
              type="button"
              onClick={() => onChange(null)}
              aria-label="Quitar fecha"
              title="Quitar fecha"
              className="text-muted transition-colors hover:text-muted-strong"
            >
              <IconX size={18} stroke={1.5} />
            </button>
          )}
        </span>
      )}
    </NativeDatePicker>
  );
}
