import { type FormEvent, type ReactNode } from 'react';
import { IconPlus } from '@tabler/icons-react';

interface AddBarProps {
  value: string;
  onChange: (value: string) => void;
  /** Called on submit; the page reads its own state to build the new item. */
  onSubmit: () => void;
  placeholder: string;
  /** Accessible label for the text input. */
  inputLabel: string;
  /** Optional secondary controls (e.g. a date picker) shown above the input row. */
  children?: ReactNode;
}

/** Bottom-anchored add bar — within thumb reach for one-handed use. Shared by the
 *  chores and shopping lists; pages pass extra controls (like a date picker) as
 *  children. */
export default function AddBar({
  value,
  onChange,
  onSubmit,
  placeholder,
  inputLabel,
  children,
}: AddBarProps) {
  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    onSubmit();
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="sticky bottom-0 -mx-4 border-t border-border bg-surface/95 px-4 py-3 backdrop-blur"
    >
      {children && <div className="mb-2 flex items-center gap-2">{children}</div>}
      <div className="flex items-center gap-2">
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          aria-label={inputLabel}
          enterKeyHint="done"
          autoCapitalize="sentences"
          className="flex-1 rounded-full border border-border bg-surface-raised px-4 py-3 text-base outline-none transition-colors placeholder:text-muted focus:border-primary"
        />
        <button
          type="submit"
          disabled={!value.trim()}
          aria-label="Agregar"
          title="Agregar"
          className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-primary text-on-primary transition-colors hover:bg-primary-hover disabled:bg-disabled"
        >
          <IconPlus size={22} stroke={2} />
        </button>
      </div>
    </form>
  );
}
