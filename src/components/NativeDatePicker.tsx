import { useState, type ReactNode } from 'react';

interface NativeDatePickerProps {
  /** yyyy-mm-dd, or null for no date. */
  value: string | null;
  onChange: (value: string | null) => void;
  /** Accessible name of the date being picked, e.g. "Vence". */
  label: string;
  required?: boolean;
  /** The visible control; calling `open` shows the picker. */
  children: (open: () => void) => ReactNode;
}

/**
 * The browser's date picker behind a control of the caller's own. The native
 * input is the only way to get the picker, but it prints the date in the
 * browser's language (month first in English), so it is kept off screen and
 * the caller shows the chosen day itself, in the app's dd/mm.
 */
export default function NativeDatePicker({
  value,
  onChange,
  label,
  required = false,
  children,
}: NativeDatePickerProps) {
  const [input, setInput] = useState<HTMLInputElement | null>(null);

  function open() {
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
    <>
      {children(open)}
      <input
        ref={setInput}
        type="date"
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
