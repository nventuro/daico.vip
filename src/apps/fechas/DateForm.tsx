import { type FormEvent, useState } from 'react';
import type { DateEntry } from '../../types';
import type { DateInput } from './useDates';
import DateFields, { type DateFieldsValue } from './DateFields';

interface DateFormProps {
  entry: DateEntry;
  onSave: (input: DateInput) => void;
  onRemove: () => void;
}

const FIELD = 'flex flex-col gap-1 text-sm text-muted';
const CONTROL =
  'rounded-xl border border-border bg-surface-raised px-3 py-2 text-base text-on-surface outline-none transition-colors focus:border-primary';

/** Edits every field of one date. Keyed by the entry's id by its caller, so the
 *  local draft starts from the entry once and never chases it afterwards. */
export default function DateForm({ entry, onSave, onRemove }: DateFormProps) {
  const [title, setTitle] = useState(entry.title);
  const [notes, setNotes] = useState(entry.notes ?? '');
  const [fields, setFields] = useState<DateFieldsValue>({
    occurs_on: entry.occurs_on,
    repeat: entry.repeat,
    repeat_months: entry.repeat_months,
    notice_days: entry.notice_days,
  });

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const value = title.trim();
    if (!value || !fields.occurs_on) return;
    onSave({ title: value, ...fields, notes: notes.trim() || null });
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <label className={FIELD}>
        <span>Título</span>
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          aria-label="Título"
          autoCapitalize="sentences"
          required
          className={CONTROL}
        />
      </label>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <DateFields
          occursOn={fields.occurs_on}
          repeat={fields.repeat}
          repeatMonths={fields.repeat_months}
          noticeDays={fields.notice_days}
          onChange={(patch) => setFields((current) => ({ ...current, ...patch }))}
          layout="form"
        />
      </div>

      <label className={FIELD}>
        <span>Notas</span>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          aria-label="Notas"
          rows={4}
          className={CONTROL}
        />
      </label>

      <div className="flex items-center justify-between gap-3">
        <button
          type="button"
          onClick={onRemove}
          className="rounded-full px-3 py-2 text-sm text-error transition-colors hover:bg-border-subtle"
        >
          Eliminar fecha
        </button>
        <button
          type="submit"
          disabled={!title.trim()}
          className="rounded-full bg-primary px-4 py-2 text-on-primary transition-colors hover:bg-primary-hover disabled:bg-disabled"
        >
          Guardar
        </button>
      </div>
    </form>
  );
}
