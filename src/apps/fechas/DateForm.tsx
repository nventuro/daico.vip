import { type FormEvent, useState } from 'react';
import type { DateEntry } from '../../types';
import FormField from '../../components/FormField';
import TextInput from '../../components/TextInput';
import TextArea from '../../components/TextArea';
import FormFooter from '../../components/FormFooter';
import { hasChanges } from '../../utils/formUtils';
import type { DateInput } from './useDates';
import DateFields, { type DateFieldsValue } from './DateFields';

interface DateFormProps {
  entry: DateEntry;
  onSave: (input: DateInput) => void;
  onRemove: () => void;
}

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

  const input: DateInput = { title: title.trim(), ...fields, notes: notes.trim() || null };
  const canSave = input.title !== '' && input.occurs_on !== '' && hasChanges(input, entry);

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!canSave) return;
    onSave(input);
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <FormField label="Título">
        <TextInput
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          aria-label="Título"
          autoCapitalize="sentences"
          required
        />
      </FormField>

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

      <FormField label="Notas">
        <TextArea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          aria-label="Notas"
          rows={4}
        />
      </FormField>

      <FormFooter
        removeLabel="Eliminar fecha"
        confirmQuestion="¿Eliminar la fecha?"
        onRemove={onRemove}
        submitDisabled={!canSave}
      />
    </form>
  );
}
