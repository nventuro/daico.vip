import { useState } from 'react';
import Comments from '../../components/Comments';
import DeleteDialog from '../../components/DeleteDialog';
import EntryHead from '../../components/EntryHead';
import EntryPage from '../../components/EntryPage';
import { useEntry } from '../../hooks/useEntry';
import { useLeave } from '../../hooks/useLeave';
import { useTextSave } from '../../hooks/useTextSave';
import { appPath } from '../types';
import DateFields from './DateFields';
import { useDates } from './useDates';

/** A date, read and written on the same page: the title on blur, each
 *  control as it changes, the comments a moment after typing stops and on
 *  leaving. */
export default function DatePage() {
  const { items, loading, error, save, remove } = useDates();
  const entry = useEntry(items);
  const leave = useLeave();
  const [deleting, setDeleting] = useState(false);

  const commentsSave = useTextSave(async (text) => {
    if (entry) await save(entry.id, { comments: text || null });
  });

  async function removeDate(id: string) {
    await remove(id);
    leave(appPath('fechas'));
  }

  return (
    <EntryPage entry={entry} loading={loading} error={error} missing="Fecha no encontrada.">
      {(entry) => (
        <article key={entry.id} className="flex flex-col gap-4">
          <EntryHead
            title={entry.title}
            onTitle={(title) => void save(entry.id, { title })}
            onDelete={() => setDeleting(true)}
            deleteLabel="Eliminar fecha"
          />

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <DateFields
              fields={{
                occurs_on: entry.occurs_on,
                repeat_every: entry.repeat_every,
                repeat_unit: entry.repeat_unit,
              }}
              onChange={(patch) => void save(entry.id, patch)}
              layout="form"
            />
          </div>

          <Comments value={entry.comments ?? ''} onChange={commentsSave.onChange} />

          <DeleteDialog
            open={deleting}
            question="¿Eliminar la fecha?"
            onCancel={() => setDeleting(false)}
            onConfirm={() => void removeDate(entry.id)}
          />
        </article>
      )}
    </EntryPage>
  );
}
