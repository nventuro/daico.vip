import { useEffect, useMemo, useRef, useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { TRIP_KINDS, type TripItem, type TripKind } from '../../lib/offline/specs';
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
import KindPickDialog from '../../components/KindPickDialog';
import FormField from '../../components/FormField';
import ListPage from '../../components/ListPage';
import SectionLabel from '../../components/SectionLabel';
import SkeletonRows from '../../components/SkeletonRows';
import UndoBar from '../../components/UndoBar';
import { appPath, entryPath } from '../types';
import ItemRow from './ItemRow';
import { tripSections } from './grouping';
import { TRIP_KIND_SHAPES } from './kinds';
import { TRIP_KIND_LABELS } from './labels';
import { deleteInboxFiles } from './inboxFiles';
import { inboxRowInput, inboxUndoOf, settleInboxUndo, type InboxUndo } from './inboxUndo';
import { useTripInbox } from './useTripInbox';
import { NEW_TRIP_ITEM, useTripItems } from './useTripItems';
import { useTrips } from './useTrips';

/** The classes a row can be born as, each with the icon its section wears. */
const KIND_OPTIONS = TRIP_KINDS.map((kind) => ({
  kind,
  label: TRIP_KIND_LABELS[kind],
  icon: TRIP_KIND_SHAPES[kind].icon,
}));

export default function TripPage() {
  const { tripId = '' } = useParams();
  const { items: trips, loading, error, save: saveTrip, remove: removeTrip } = useTrips();
  const trip = useEntry(trips, 'tripId');
  const {
    items,
    loading: itemsLoading,
    error: itemsError,
    add,
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
  // The offer the undo was taken on, so its end is told from every other.
  const taken = useRef<InboxUndo | null>(null);
  const [deleting, setDeleting] = useState(false);
  // The title typed into the bar, while its class is being asked.
  const [naming, setNaming] = useState<string | null>(null);

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

  // The staged files outlive the offer, so an undo finds the rows' PDFs where
  // they were. Once the offer is over any other way — timed out, replaced, the
  // screen left — they are let go of.
  const offered = undo.value;
  useEffect(() => {
    if (!offered) return;
    return () =>
      settleInboxUndo(offered, taken.current === offered, (ids) => void deleteInboxFiles(ids));
  }, [offered]);

  /** Takes the rows and their attachments out again and puts the suggestions
   *  back as they were; a trip created for them goes too, and with it the
   *  screen. */
  async function undoInbox(added: InboxUndo) {
    taken.current = added;
    undo.clear();
    for (const attachment of attachments) {
      if (added.attachmentIds.includes(attachment.id)) await removeAttachment(attachment);
    }
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

  /** A row is born from its title and its class, chosen now and never again,
   *  and opened to have the rest said about it. */
  async function addItem(title: string, kind: TripKind) {
    setNaming(null);
    const id = await add(tripId, { ...NEW_TRIP_ITEM, kind, title, done: false });
    if (id) navigate(entryPath('viajes', tripId, id));
  }

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
          // A row's class is asked first, and the bar keeps the title while
          // it is.
          onAdd={(title) => {
            setNaming(title);
            return false;
          }}
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
            {naming !== null && (
              <KindPickDialog
                title={naming}
                options={KIND_OPTIONS}
                onPick={(kind) => void addItem(naming, kind)}
                onClose={() => setNaming(null)}
              />
            )}
          </>
        )}
      </EntryPage>
    </ListPage>
  );
}
