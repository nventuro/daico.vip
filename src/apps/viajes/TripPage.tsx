import { useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import type { TripItem } from '../../lib/offline/specs';
import { ownersWithAttachments, useAttachments } from '../../hooks/useAttachments';
import { useEntry } from '../../hooks/useEntry';
import { useLeave } from '../../hooks/useLeave';
import { UNDO_MS, useUndo } from '../../hooks/useUndo';
import { todayIso } from '../../utils/dateUtils';
import AddBar from '../../components/AddBar';
import CompletedSection from '../../components/CompletedSection';
import DatePicker from '../../components/DatePicker';
import DeleteDialog from '../../components/DeleteDialog';
import EmptyState from '../../components/EmptyState';
import EntryHead from '../../components/EntryHead';
import EntryPage from '../../components/EntryPage';
import FormField from '../../components/FormField';
import ListPage from '../../components/ListPage';
import SectionLabel from '../../components/SectionLabel';
import SkeletonRows from '../../components/SkeletonRows';
import UndoBar from '../../components/UndoBar';
import { appPath, entryPath } from '../types';
import ItemRow from './ItemRow';
import { draftTitleState } from '../../hooks/useDraftTitle';
import { tripSections } from './grouping';
import { inboxRowInput, inboxUndoOf, type InboxUndo } from './inboxUndo';
import { useTripInbox } from './useTripInbox';
import { useTripItems } from './useTripItems';
import { useTrips } from './useTrips';

export default function TripPage() {
  const { tripId = '' } = useParams();
  const { items: trips, loading, error, save: saveTrip, remove: removeTrip } = useTrips();
  const trip = useEntry(trips, 'tripId');
  const {
    items,
    loading: itemsLoading,
    error: itemsError,
    save,
    remove: removeItem,
  } = useTripItems(tripId);
  const { insert: restage } = useTripInbox();
  const { items: attachments, remove: removeAttachment } = useAttachments();
  const attached = useMemo(() => ownersWithAttachments(attachments, 'trip_item'), [attachments]);
  const navigate = useNavigate();
  const leave = useLeave();
  const { state, pathname } = useLocation();
  const undo = useUndo<InboxUndo>(UNDO_MS);
  const [deleting, setDeleting] = useState(false);

  // What the review just put in arrives with the navigation and is offered
  // for a moment; the navigation is then replaced without it, so coming
  // back to the screen later does not offer it again.
  const arrived = inboxUndoOf(state);
  const offer = undo.offer;
  useEffect(() => {
    if (!arrived) return;
    offer(arrived);
    navigate(pathname, { replace: true, state: null });
  }, [arrived, offer, navigate, pathname]);

  /** Takes the rows out again and puts the suggestions back as they were;
   *  a trip created for them goes too, and with it the screen. */
  async function undoInbox(added: InboxUndo) {
    undo.clear();
    for (const id of added.itemIds) await removeItem(id);
    for (const row of added.staged) await restage(inboxRowInput(row));
    if (added.tripCreated) {
      await removeTrip(added.tripId);
      leave(appPath('viajes'));
    }
  }

  /** A trip's rows have no meaning without it: the server cascades them, and
   *  this device must not be left listing rows whose trip is gone — they would
   *  still be found by Buscar and still announce themselves on Inicio. */
  async function removeWithRows(id: string) {
    for (const row of items) {
      for (const file of attachments) {
        if (file.owner_kind === 'trip_item' && file.owner_id === row.id) {
          await removeAttachment(file);
        }
      }
      await removeItem(row.id);
    }
    await removeTrip(id);
    leave(appPath('viajes'));
  }

  const today = todayIso();
  const { sections, done } = useMemo(() => tripSections(items), [items]);
  const justAdded = undo.value;

  function renderItem(item: TripItem) {
    return (
      <ItemRow
        key={item.id}
        item={item}
        today={today}
        hasAttachments={attached.has(item.id)}
        onToggle={() => void save(item.id, { done: !item.done })}
      />
    );
  }

  return (
    <ListPage
      loading={loading || itemsLoading}
      error={error ?? itemsError}
      skeleton={<SkeletonRows subtitle />}
      bar={
        <AddBar
          // The row is written on save, so what is typed here only travels to
          // the form, where its class is chosen.
          onAdd={(title) =>
            navigate(entryPath('viajes', tripId, 'nuevo'), { state: draftTitleState(title) })
          }
          placeholder="Agregar al viaje..."
          inputLabel="Agregar al viaje"
          notice={
            justAdded && (
              <UndoBar message={justAdded.label} onAction={() => void undoInbox(justAdded)} />
            )
          }
        />
      }
    >
      {/* A trip is both an entry and a list: the list's frame carries the
          offline notice and the add bar, and this says when it is not there. */}
      <EntryPage entry={trip} loading={loading} missing="Viaje no encontrado.">
        {(trip) => (
          <>
            <div key={trip.id} className="mb-6 flex flex-col gap-4">
              <EntryHead
                title={trip.title}
                onTitle={(title) => void saveTrip(trip.id, { title })}
                autoCapitalize="sentences"
                onDelete={() => setDeleting(true)}
                deleteLabel="Eliminar viaje"
              />
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <FormField label="Desde">
                  <DatePicker
                    value={trip.starts_on}
                    onChange={(day) => void saveTrip(trip.id, { starts_on: day })}
                    label="Desde"
                  />
                </FormField>
                <FormField label="Hasta">
                  <DatePicker
                    value={trip.ends_on}
                    onChange={(day) => void saveTrip(trip.id, { ends_on: day })}
                    label="Hasta"
                  />
                </FormField>
              </div>
            </div>

            {sections.length === 0 && done.length === 0 && (
              <EmptyState>Todavía no hay nada en este viaje.</EmptyState>
            )}
            {sections.map((section) => (
              <section key={section.kind} className="mb-6">
                <SectionLabel>{section.label}</SectionLabel>
                <ul>{section.items.map(renderItem)}</ul>
              </section>
            ))}
            <CompletedSection label="Hechos" count={done.length}>
              <ul>{done.map(renderItem)}</ul>
            </CompletedSection>

            <DeleteDialog
              open={deleting}
              question="¿Eliminar el viaje?"
              onCancel={() => setDeleting(false)}
              onConfirm={() => void removeWithRows(trip.id)}
            />
          </>
        )}
      </EntryPage>
    </ListPage>
  );
}
