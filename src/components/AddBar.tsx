import { type FormEvent, type ReactNode, useRef, useState } from 'react';
import { IconPlus } from '@tabler/icons-react';
import { ADD_BAR_BUTTON_CLASS, ADD_BAR_CLASS, ADD_BAR_INPUT_CLASS } from './controlClasses';

interface AddBarProps {
  /** Called with what was typed, never blank; the bar clears itself. */
  onAdd: (text: string) => void;
  placeholder: string;
  /** Accessible label for the text input. */
  inputLabel: string;
  /** Optional secondary controls (e.g. a date picker) shown under the input row. */
  children?: ReactNode;
  /** What belongs above the input row: a transient undo bar, or a list-level action. */
  notice?: ReactNode;
  /** Whether the keyboard capitalises what is typed: a list of things named
   *  after places takes capitals, one of things to do or buy does not. */
  autoCapitalize?: 'none' | 'sentences';
}

/** Bottom-anchored add bar — within thumb reach for one-handed use. The bar
 *  holds what is being typed; pages pass extra controls (like a date picker) as
 *  children and what goes above the input (an undo bar, a list-level action) as
 *  `notice`, so both stay pinned with the bar. */
export default function AddBar({
  onAdd,
  placeholder,
  inputLabel,
  children,
  notice,
  autoCapitalize = 'none',
}: AddBarProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [value, setValue] = useState('');

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const text = value.trim();
    if (text) {
      setValue('');
      onAdd(text);
    }
    // Keep focus so several items can be added in a row without re-tapping the
    // input — on mobile this also keeps the keyboard open between adds.
    inputRef.current?.focus();
  }

  return (
    <div className={ADD_BAR_CLASS}>
      {notice && <div className="mb-3">{notice}</div>}
      <form onSubmit={handleSubmit}>
        <div className="flex items-center gap-2">
          <input
            ref={inputRef}
            type="text"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            placeholder={placeholder}
            aria-label={inputLabel}
            enterKeyHint="done"
            autoCapitalize={autoCapitalize}
            className={ADD_BAR_INPUT_CLASS}
          />
          <button
            type="submit"
            // Don't let pressing the button move focus off the input: that blur is
            // what closes the mobile keyboard and forces a re-tap before the next
            // item. preventDefault on pointer-down keeps focus; the click (submit)
            // still fires.
            onPointerDown={(e) => e.preventDefault()}
            disabled={!value.trim()}
            aria-label="Agregar"
            title="Agregar"
            className={ADD_BAR_BUTTON_CLASS}
          >
            <IconPlus size={22} stroke={2} />
          </button>
        </div>
        {children && <div className="mt-2 flex flex-wrap items-center gap-2">{children}</div>}
      </form>
    </div>
  );
}
