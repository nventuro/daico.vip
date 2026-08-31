import { useState, type ReactNode } from 'react';

interface NativeTimePickerProps {
  /** HH:MM, or null for no hour. */
  value: string | null;
  onChange: (value: string | null) => void;
  /** Accessible name of the hour being picked, e.g. "Salida". */
  label: string;
  required?: boolean;
  /** The visible control; calling `open` shows the picker. */
  children: (open: () => void) => ReactNode;
}

/**
 * The browser's time picker behind a control of the caller's own. The native
 * input is the only way to get the picker, but it prints the hour in the
 * browser's language (12-hour with am/pm in English), so it is kept off screen
 * and the caller shows the chosen hour itself, on the 24-hour clock.
 */
export default function NativeTimePicker({
  value,
  onChange,
  label,
  required = false,
  children,
}: NativeTimePickerProps) {
  const [input, setInput] = useState<HTMLInputElement | null>(null);

  function open() {
    if (!input) return;
    try {
      input.showPicker();
    } catch {
      // Older engines without showPicker(): focusing the input still lets the
      // hour be typed.
      input.focus();
    }
  }

  return (
    <>
      {children(open)}
      <input
        ref={setInput}
        type="time"
        value={value ?? ''}
        onChange={(e) => onChange(e.target.value || null)}
        aria-label={label}
        required={required}
        tabIndex={-1}
        className="sr-only"
      />
    </>
  );
}
