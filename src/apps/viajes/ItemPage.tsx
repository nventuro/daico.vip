import { useCallback, useState } from 'react';
import { useParams } from 'react-router-dom';
import type { TripItem } from '../../lib/offline/specs';
import AttachmentGrid from '../../components/AttachmentGrid';
import CheckRow from '../../components/CheckRow';
import { StaticChip } from '../../components/Chip';
import Comments from '../../components/Comments';
import DeleteDialog from '../../components/DeleteDialog';
import EntryHead from '../../components/EntryHead';
import EntryPage from '../../components/EntryPage';
import SectionLabel from '../../components/SectionLabel';
import { useAttachments } from '../../hooks/useAttachments';
import { useEntry } from '../../hooks/useEntry';
import { useLeave, useLeaveBack } from '../../hooks/useLeave';
import { useTextSave } from '../../hooks/useTextSave';
import { appPath, entryPath } from '../types';
import ItemDateFields from './ItemDateFields';
import type { InboxUndo } from './inboxUndo';
import { TRIP_KIND_SHAPES, isFlight } from './kinds';
import {
  BOARDING_PASS_SECTION_LABEL,
  TRIP_KIND_LABELS,
  removeItemLabel,
  removeItemQuestion,
} from './labels';
import { useInboxUndoArrival } from './useInboxUndo';
import { useTripItems } from './useTripItems';

/** A row of a trip, read and written on the same page: the title on blur,
 *  each control as it changes, the comments a moment after typing stops and
 *  on leaving. Its class is stated, never changed. A flight keeps its
 *  boarding passes on a shelf of their own, apart from its other files. The
 *  one control that leaves the page is a pendiente's tick. */
export default function ItemPage() {
  const { tripId = '', itemId = '' } = useParams();
  const { items, loading, error, save, setDone, remove } = useTripItems(tripId);
  const entry = useEntry(items, 'itemId');
  const attachments = useAttachments({ kind: 'trip_item', id: entry?.id ?? '' });
  const boardingPasses = useAttachments({ kind: 'boarding_pass', id: entry?.id ?? '' });
  const leave = useLeave();
  const leaveBack = useLeaveBack();
  const [deleting, setDeleting] = useState(false);

  // A boarding pass the review just put on this pasaje is offered to be
  // undone here; an undo that takes the pasaje made for it goes up to the
  // trip, and one that takes the trip too, to the list.
  useInboxUndoArrival(
    useCallback(
      (undo: InboxUndo) =>
        undo.tripCreated
          ? appPath('viajes')
          : undo.itemIds.includes(itemId)
            ? entryPath('viajes', tripId)
            : null,
      [tripId, itemId],
    ),
  );

  const commentsSave = useTextSave(async (text) => {
    if (entry) await save(entry.id, { comments: text || null });
  }, entry?.id);

  /** Ticks the pendiente as the trip's list does, or unticks it, and leaves
   *  the page: the trip — or wherever the page was opened from — is where the
   *  row's new place and the undo are shown. */
  function toggleDone(entry: TripItem) {
    void setDone(entry.id, !entry.done);
    leaveBack(entryPath('viajes', tripId));
  }

  async function removeItem(id: string) {
    // The row's files go with it, boarding passes included; nothing else
    // would ever list them.
    await attachments.removeAll();
    await boardingPasses.removeAll();
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

          {TRIP_KIND_SHAPES[entry.kind].ticked && (
            <CheckRow checked={entry.done} onToggle={() => toggleDone(entry)} className="py-2">
              {entry.done ? 'Hecho' : 'Marcar como hecho'}
            </CheckRow>
          )}

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

          {/* What is looked for at the airport, above everything else said
              about the pasaje; the e-ticket and the rest stay under Adjuntos.
              A bus leg boards with its ticket, and has no shelf. */}
          {isFlight(entry) && (
            <div>
              <SectionLabel>{BOARDING_PASS_SECTION_LABEL}</SectionLabel>
              <AttachmentGrid
                owner={{ kind: 'boarding_pass', id: entry.id }}
                ownerPath={entryPath('viajes', entry.trip_id, entry.id)}
              />
            </div>
          )}

          <Comments value={entry.comments ?? ''} onChange={commentsSave.onChange} />

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
