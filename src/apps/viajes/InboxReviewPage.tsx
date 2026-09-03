import { useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { TRIP_ITEMS_SPEC } from '../../lib/offline/specs';
import { useLeave } from '../../hooks/useLeave';
import { useOfflineTable } from '../../hooks/useOfflineTable';
import { relativeDayTime, todayIso } from '../../utils/dateUtils';
import EntryPage from '../../components/EntryPage';
import FormField from '../../components/FormField';
import FormFooter from '../../components/FormFooter';
import Heading from '../../components/Heading';
import SectionLabel from '../../components/SectionLabel';
import Select from '../../components/Select';
import { appPath, entryPath } from '../types';
import InboxItemRow from './InboxItemRow';
import {
  CREATE_TRIP_CHOICE,
  inboxTripChoices,
  suggestedTripChoice,
  type InboxGroup,
} from './grouping';
import { confirmInbox, discardInbox } from './inboxConfirm';
import { inboxUndoState } from './inboxUndo';
import {
  addInboxLabel,
  createTripLabel,
  inboxCountLabel,
  inboxSourceLabel,
  tripChoiceLabel,
} from './labels';
import { useTripInbox } from './useTripInbox';
import { useTrips } from './useTrips';

/**
 * One email's suggestions, reviewed whole: what arrived, the trip to put it
 * in, and two ways out. Confirming writes the real rows and leads to the
 * trip, where it can be undone for a moment; discarding asks first.
 */
export default function InboxReviewPage() {
  const { importId = '' } = useParams();
  const { groups, loading, error, remove } = useTripInbox();
  const { items: trips, loading: tripsLoading, error: tripsError, add: addTrip } = useTrips();
  // The rows go in as they came, capitals and all — not through the trip
  // rows' own `add`, which lower-cases what is typed into an add bar.
  const { insert: addItem } = useOfflineTable(TRIP_ITEMS_SPEC);
  const navigate = useNavigate();
  const leave = useLeave();

  const today = todayIso();
  const group = groups.find((candidate) => candidate.importId === importId);
  const choices = useMemo(() => inboxTripChoices(trips, today), [trips, today]);
  // Nothing chosen yet means the suggestion, which is only known once the
  // trips are read, so it is resolved at render rather than stored.
  const [chosen, setChosen] = useState<string | null>(null);
  const choice = chosen ?? suggestedTripChoice(choices);

  async function confirm(group: InboxGroup) {
    const undo = await confirmInbox(group, choice, { addTrip, addItem, removeStaged: remove });
    if (undo) navigate(entryPath('viajes', undo.tripId), { state: inboxUndoState(undo) });
  }

  async function discard(group: InboxGroup) {
    await discardInbox(group, { removeStaged: remove });
    leave(appPath('viajes'));
  }

  return (
    <EntryPage
      entry={group}
      loading={loading || tripsLoading}
      error={error ?? tripsError}
      missing="No se encontró en el inbox."
    >
      {(group) => (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            void confirm(group);
          }}
          className="flex flex-col gap-4"
        >
          <div>
            <Heading>{group.tripTitle}</Heading>
            <p className="mt-1 text-sm text-muted">{inboxSourceLabel(group.emailSubject)}</p>
            <p className="text-sm text-muted">{relativeDayTime(today, group.receivedAt)}</p>
          </div>

          <FormField label="Viaje">
            <Select value={choice} onChange={(e) => setChosen(e.target.value)}>
              {choices.map((trip) => (
                <option key={trip.id} value={trip.id}>
                  {tripChoiceLabel(trip, today)}
                </option>
              ))}
              <option value={CREATE_TRIP_CHOICE}>{createTripLabel(group.tripTitle)}</option>
            </Select>
          </FormField>

          <section>
            <SectionLabel detail={inboxCountLabel(group.items.length)}>Qué llegó</SectionLabel>
            <ul>
              {group.items.map((item) => (
                <InboxItemRow key={item.id} item={item} today={today} />
              ))}
            </ul>
          </section>

          <FormFooter
            removeLabel="Descartar"
            confirmQuestion="¿Descartar lo que llegó?"
            onRemove={() => void discard(group)}
            submitLabel={addInboxLabel(group.items.length)}
          />
        </form>
      )}
    </EntryPage>
  );
}
