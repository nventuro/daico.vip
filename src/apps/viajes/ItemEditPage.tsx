import { useParams } from 'react-router-dom';
import { useLeave } from '../../hooks/useLeave';
import { useAttachments } from '../../hooks/useAttachments';
import { useEntry } from '../../hooks/useEntry';
import EntryPage from '../../components/EntryPage';
import { entryPath } from '../types';
import ItemForm from './ItemForm';
import { useTripItems, type TripItemFields } from './useTripItems';

export default function ItemEditPage() {
  const { tripId = '' } = useParams();
  const { items, loading, error, save, remove } = useTripItems(tripId);
  const entry = useEntry(items, 'itemId');
  const attachments = useAttachments({ kind: 'trip_item', id: entry?.id ?? '' });
  const leave = useLeave();

  return (
    <EntryPage entry={entry} loading={loading} error={error} missing="No se encontró en el viaje.">
      {(entry) => (
        <ItemForm
          key={entry.id}
          item={entry}
          onSave={async (input: TripItemFields) => {
            await save(entry.id, input);
            leave(entryPath('viajes', tripId));
          }}
          onRemove={async () => {
            // The row's pictures go with it; nothing else would ever list them.
            await attachments.removeAll();
            await remove(entry.id);
            leave(entryPath('viajes', tripId));
          }}
        />
      )}
    </EntryPage>
  );
}
