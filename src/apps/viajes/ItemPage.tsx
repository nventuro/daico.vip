import { useState } from 'react';
import { useParams } from 'react-router-dom';
import AttachmentGrid from '../../components/AttachmentGrid';
import { StaticChip } from '../../components/Chip';
import DeleteDialog from '../../components/DeleteDialog';
import Body from '../../components/editor/Body';
import EntryHead from '../../components/EntryHead';
import EntryPage from '../../components/EntryPage';
import SectionLabel from '../../components/SectionLabel';
import { useAttachments } from '../../hooks/useAttachments';
import { useEntry } from '../../hooks/useEntry';
import { useLeave } from '../../hooks/useLeave';
import { useTextSave } from '../../hooks/useTextSave';
import { entryPath } from '../types';
import ItemDateFields from './ItemDateFields';
import { TRIP_KIND_LABELS, removeItemLabel, removeItemQuestion } from './labels';
import { useTripItems } from './useTripItems';

/** A row of a trip, read and written on the same page: the title on blur,
 *  each control as it changes, the comments a moment after typing stops and
 *  on leaving. Its class is stated, never changed. */
export default function ItemPage() {
  const { tripId = '' } = useParams();
  const { items, loading, error, save, remove } = useTripItems(tripId);
  const entry = useEntry(items, 'itemId');
  const attachments = useAttachments({ kind: 'trip_item', id: entry?.id ?? '' });
  const leave = useLeave();
  const [deleting, setDeleting] = useState(false);

  const commentsSave = useTextSave(async (text) => {
    if (entry) await save(entry.id, { comments: text || null });
  });

  async function removeItem(id: string) {
    // The row's pictures go with it; nothing else would ever list them.
    await attachments.removeAll();
    await remove(id);
    leave(entryPath('viajes', tripId));
  }

  return (
    <EntryPage entry={entry} loading={loading} error={error} missing="No se encontró en el viaje.">
      {(entry) => (
        <article key={entry.id} className="flex flex-col gap-4">
          <EntryHead
            title={entry.title}
            onTitle={(title) => void save(entry.id, { title })}
            chips={<StaticChip>{TRIP_KIND_LABELS[entry.kind]}</StaticChip>}
            onDelete={() => setDeleting(true)}
            deleteLabel={removeItemLabel(entry.kind)}
          />

          <ItemDateFields
            kind={entry.kind}
            fields={{
              on_date: entry.on_date,
              at_time: entry.at_time,
              ends_on: entry.ends_on,
              ends_at: entry.ends_at,
              from_code: entry.from_code,
              to_code: entry.to_code,
            }}
            onChange={(patch) => void save(entry.id, patch)}
          />

          <Body
            value={entry.comments ?? ''}
            onChange={commentsSave.onChange}
            placeholder="Comentarios"
            ariaLabel="Comentarios"
          />

          <div>
            <SectionLabel>Adjuntos</SectionLabel>
            <AttachmentGrid
              owner={{ kind: 'trip_item', id: entry.id }}
              ownerPath={entryPath('viajes', entry.trip_id, entry.id)}
            />
          </div>

          <DeleteDialog
            open={deleting}
            question={removeItemQuestion(entry.kind)}
            onCancel={() => setDeleting(false)}
            onConfirm={() => void removeItem(entry.id)}
          />
        </article>
      )}
    </EntryPage>
  );
}
