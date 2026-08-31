import { useNavigate } from 'react-router-dom';
import { entryPath } from '../types';
import TripForm from './TripForm';
import { useDraftTitle } from './draftTitle';
import { NEW_TRIP, useTrips, type TripInput } from './useTrips';

export default function TripNewPage() {
  const { add } = useTrips();
  const navigate = useNavigate();
  const title = useDraftTitle();

  return (
    <TripForm
      trip={{ ...NEW_TRIP, title }}
      onSave={async (input: TripInput) => {
        const id = await add(input);
        // A trip starts empty: go straight to it, which is where it is filled.
        if (id) navigate(entryPath('viajes', id));
      }}
    />
  );
}
