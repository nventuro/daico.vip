import { useParams } from 'react-router-dom';
import { useLeave } from '../../hooks/useLeave';
import { entryPath } from '../types';
import ItemForm from './ItemForm';
import { useDraftTitle } from '../../hooks/useDraftTitle';
import { NEW_TRIP_ITEM, useTripItems, type TripItemFields } from './useTripItems';

export default function ItemNewPage() {
  const { tripId = '' } = useParams();
  const { add } = useTripItems(tripId);
  const leave = useLeave();
  const title = useDraftTitle();

  return (
    <ItemForm
      item={{ ...NEW_TRIP_ITEM, title }}
      onSave={async (input: TripItemFields) => {
        // Nothing is written until here, so backing out leaves nothing behind.
        await add(tripId, { ...input, done: false });
        leave(entryPath('viajes', tripId));
      }}
    />
  );
}
