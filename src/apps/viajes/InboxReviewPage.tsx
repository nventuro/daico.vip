import { useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { IconTrash } from '@tabler/icons-react';
import { INBOX_KEY_SPEC, TRIP_ITEMS_SPEC } from '../../lib/offline/specs';
import { useAttachments } from '../../hooks/useAttachments';
import { useLeave } from '../../hooks/useLeave';
import { useMasterKey } from '../../hooks/useMasterKey';
import { useOfflineTable } from '../../hooks/useOfflineTable';
import { useOnline } from '../../hooks/useOnline';
import { relativeDayTime, todayIso } from '../../utils/dateUtils';
import { errorMessage } from '../../utils/textUtils';
import DeleteDialog from '../../components/DeleteDialog';
import EntryPage from '../../components/EntryPage';
import FormField from '../../components/FormField';
import FormFooter from '../../components/FormFooter';
import Heading from '../../components/Heading';
import IconButton from '../../components/IconButton';
import LoadingLine from '../../components/LoadingLine';
import OfflineBanner from '../../components/OfflineBanner';
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
import { confirmInbox, discardInbox, groupFileIds, sealedFilesOf } from './inboxConfirm';
import { deleteInboxFiles } from './inboxFiles';
import { inboxUndoState } from './inboxUndo';
import { useMissingInboxFiles } from './useMissingInboxFiles';
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
 * in, and two ways out. Confirming writes the real rows, each with the PDFs
 * it came with, and leads to the trip, where it can be undone for a moment;
 * discarding asks first.
 */
export default function InboxReviewPage() {
  const { importId = '' } = useParams();
  const { groups, loading, error, remove } = useTripInbox();
  const { items: trips, loading: tripsLoading, error: tripsError, add: addTrip } = useTrips();
  // The rows go in as they came, capitals and all — not through the trip
  // rows' own `add`, which lower-cases what is typed into an add bar.
  const { insert: addItem } = useOfflineTable(TRIP_ITEMS_SPEC);
  const { addSealed } = useAttachments();
  const { items: inboxKeys } = useOfflineTable(INBOX_KEY_SPEC);
  const masterKey = useMasterKey();
  const online = useOnline();
  const navigate = useNavigate();
  const leave = useLeave();
  const [discarding, setDiscarding] = useState(false);
  const [problem, setProblem] = useState<string | null>(null);

  const today = todayIso();
  const group = groups.find((candidate) => candidate.importId === importId);
  const choices = useMemo(() => inboxTripChoices(trips, today), [trips, today]);
  // Nothing chosen yet means the suggestion, which is only known once the
  // trips are read, so it is resolved at render rather than stored.
  const [chosen, setChosen] = useState<string | null>(null);
  const choice = chosen ?? suggestedTripChoice(choices);

  // The group's PDFs come to every device with a sync. Until they are here
  // the group says so, and with no connection to bring them it waits: a row
  // is never added short of its PDF.
  const fileIds = useMemo(() => (group ? groupFileIds(group) : []), [group]);
  const missing = useMissingInboxFiles(fileIds);
  const lacking = missing !== null && missing.length > 0;

  async function confirm(group: InboxGroup) {
    if (masterKey.status !== 'unlocked') return;
    setProblem(null);
    let files;
    try {
      files = await sealedFilesOf(group, masterKey.key, inboxKeys[0]);
    } catch (e) {
      setProblem(errorMessage(e));
      return;
    }
    const undo = await confirmInbox(
      group,
      choice,
      {
        addTrip,
        addItem,
        addAttachment: addSealed,
        removeStaged: remove,
        removeFiles: deleteInboxFiles,
      },
      files,
    );
    if (undo) navigate(entryPath('viajes', undo.tripId), { state: inboxUndoState(undo) });
  }

  async function discard(group: InboxGroup) {
    await discardInbox(group, { removeStaged: remove, removeFiles: deleteInboxFiles });
    leave(appPath('viajes'));
  }

  return (
    <EntryPage
      entry={group}
      loading={loading || tripsLoading}
      error={error ?? tripsError ?? problem}
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
          {lacking && !online && (
            <OfflineBanner>
              Los PDF de este correo todavía no llegaron a este dispositivo: para agregarlo hace
              falta conexión.
            </OfflineBanner>
          )}
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <Heading>{group.tripTitle}</Heading>
              <p className="mt-1 text-sm text-muted">{inboxSourceLabel(group.emailSubject)}</p>
              <p className="text-sm text-muted">{relativeDayTime(today, group.receivedAt)}</p>
            </div>
            {/* Discarding is the group's delete: from the head, behind the
                question, the way an entry's is. */}
            <IconButton label="Descartar" icon={IconTrash} onClick={() => setDiscarding(true)} />
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
            {lacking && online && <LoadingLine className="mb-2" />}
            <ul>
              {group.items.map((item) => (
                <InboxItemRow key={item.id} item={item} today={today} />
              ))}
            </ul>
          </section>

          <FormFooter
            submitLabel={addInboxLabel(group.items.length)}
            submitDisabled={lacking && !online}
          />

          <DeleteDialog
            open={discarding}
            question="¿Descartar lo que llegó?"
            confirmLabel="Descartar"
            onCancel={() => setDiscarding(false)}
            onConfirm={() => void discard(group)}
          />
        </form>
      )}
    </EntryPage>
  );
}
