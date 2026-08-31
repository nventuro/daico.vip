import { useNavigate, useParams } from 'react-router-dom';
import { entryPath } from '../types';
import ItemForm from './ItemForm';
import { useDraftTitle } from './draftTitle';
import { NEW_TRIP_ITEM, useTripItems, type TripItemFields } from './useTripItems';

export default function ItemNewPage() {
  const { tripId = '' } = useParams();
  const { add } = useTripItems(tripId);
  const navigate = useNavigate();
  const title = useDraftTitle();

  return (
    <ItemForm
      item={{ ...NEW_TRIP_ITEM, title }}
      onSave={async (input: TripItemFields) => {
        // Nothing is written until here, so backing out leaves nothing behind.
        await add(tripId, { ...input, done: false });
        navigate(entryPath('viajes', tripId));
      }}
    />
  );
}
