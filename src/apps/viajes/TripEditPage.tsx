import { useNavigate } from 'react-router-dom';
import { useAttachments } from '../../hooks/useAttachments';
import { useEntry } from '../../hooks/useEntry';
import EntryPage from '../../components/EntryPage';
import { appPath, entryPath } from '../types';
import TripForm from './TripForm';
import { useTripItems } from './useTripItems';
import { useTrips, type TripInput } from './useTrips';

export default function TripEditPage() {
  const { items, loading, error, save, remove } = useTrips();
  const trip = useEntry(items, 'tripId');
  const { items: rows, remove: removeItem } = useTripItems(trip?.id);
  const { items: attachments, remove: removeAttachment } = useAttachments();
  const navigate = useNavigate();

  /** A trip's rows have no meaning without it: the server cascades them, and
   *  this device must not be left listing rows whose trip is gone — they would
   *  still be found by Buscar and still announce themselves on Inicio. */
  async function removeTrip(id: string) {
    for (const row of rows) {
      for (const file of attachments) {
        if (file.owner_kind === 'trip_item' && file.owner_id === row.id) {
          await removeAttachment(file);
        }
      }
      await removeItem(row.id);
    }
    await remove(id);
    navigate(appPath('viajes'));
  }

  return (
    <EntryPage entry={trip} loading={loading} error={error} missing="Viaje no encontrado.">
      {(trip) => (
        <TripForm
          key={trip.id}
          trip={trip}
          onSave={async (input: TripInput) => {
            await save(trip.id, input);
            navigate(entryPath('viajes', trip.id));
          }}
          onRemove={() => void removeTrip(trip.id)}
        />
      )}
    </EntryPage>
  );
}
