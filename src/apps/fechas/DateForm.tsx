import { useState } from 'react';
import type { DateEntry } from '../../lib/offline/specs';
import TitleField from '../../components/TitleField';
import CommentsField from '../../components/CommentsField';
import FormFooter from '../../components/FormFooter';
import { entryForm } from '../../utils/formUtils';
import { lowercaseTrimmed } from '../../utils/textUtils';
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
  const [comments, setComments] = useState(entry.comments ?? '');
  const [fields, setFields] = useState<DateFieldsValue>({
    occurs_on: entry.occurs_on,
    repeat_every: entry.repeat_every,
    repeat_unit: entry.repeat_unit,
    notice_days: entry.notice_days,
  });

  const input: DateInput = {
    title: lowercaseTrimmed(title),
    ...fields,
    comments: comments.trim() || null,
  };
  const { canSave, onSubmit } = entryForm(
    input,
    entry,
    onSave,
    input.title !== '' && input.occurs_on !== '',
  );

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-4">
      <TitleField value={title} onChange={setTitle} />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <DateFields
          fields={fields}
          onChange={(patch) => setFields((current) => ({ ...current, ...patch }))}
          layout="form"
        />
      </div>

      <CommentsField value={comments} onChange={setComments} rows={4} />

      <FormFooter
        removeLabel="Eliminar fecha"
        confirmQuestion="¿Eliminar la fecha?"
        onRemove={onRemove}
        submitDisabled={!canSave}
      />
    </form>
  );
}
