import { useState, type FormEvent } from 'react';
import { DATE_NOTICE_DAYS_DEFAULT } from '../../lib/offline/specs';
import Body from '../../components/editor/Body';
import ErrorLine from '../../components/ErrorLine';
import FormField from '../../components/FormField';
import FormFooter from '../../components/FormFooter';
import TitleField from '../../components/TitleField';
import { useDraftTitle } from '../../hooks/useDraftTitle';
import { useLeave } from '../../hooks/useLeave';
import { todayIso } from '../../utils/dateUtils';
import { lowercaseTrimmed } from '../../utils/textUtils';
import { entryPath } from '../types';
import DateFields, { type DateFieldsValue } from './DateFields';
import { useDates } from './useDates';

/** Where a date is born: everything about it, written nowhere until Guardar,
 *  which opens the date where it is then edited in place. */
export default function DateNewPage() {
  const { error, add } = useDates();
  const leave = useLeave();
  const draft = useDraftTitle();
  const [title, setTitle] = useState(draft);
  const [fields, setFields] = useState<DateFieldsValue>({
    occurs_on: todayIso(),
    repeat_every: null,
    repeat_unit: null,
    notice_days: DATE_NOTICE_DAYS_DEFAULT,
  });
  const [comments, setComments] = useState('');
  const name = lowercaseTrimmed(title);

  async function submit(e: FormEvent) {
    e.preventDefault();
    if (!name) return;
    const id = await add({ title: name, ...fields, comments: comments.trim() || null });
    if (id) leave(entryPath('fechas', id));
  }

  return (
    <>
      <ErrorLine error={error} className="mb-4" />
      <form onSubmit={(e) => void submit(e)} className="flex flex-col gap-4">
        <TitleField value={title} onChange={setTitle} />

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <DateFields
            fields={fields}
            onChange={(patch) => setFields((current) => ({ ...current, ...patch }))}
            layout="form"
          />
        </div>

        <FormField label="Comentarios" group>
          <Body value="" onChange={setComments} placeholder="Comentarios" ariaLabel="Comentarios" />
        </FormField>

        <FormFooter submitDisabled={!name} />
      </form>
    </>
  );
}
