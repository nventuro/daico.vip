import { useState } from 'react';
import { entryForm } from '../../utils/formUtils';
import DatePicker from '../../components/DatePicker';
import FormField from '../../components/FormField';
import FormFooter from '../../components/FormFooter';
import TitleField from '../../components/TitleField';
import { NEW_TRIP, type TripInput } from './useTrips';

interface TripFormProps {
  /** What the trip starts from: the title the add bar typed, and no days. */
  trip: TripInput;
  onSave: (input: TripInput) => void;
}

/** Where a trip is born: its title and the days it covers, which are stored
 *  rather than derived from what is booked on it. Written nowhere until
 *  Guardar, so backing out leaves nothing behind. */
export default function TripForm({ trip, onSave }: TripFormProps) {
  const [title, setTitle] = useState(trip.title);
  const [startsOn, setStartsOn] = useState(trip.starts_on);
  const [endsOn, setEndsOn] = useState(trip.ends_on);

  const input: TripInput = {
    title: title.trim(),
    starts_on: startsOn,
    ends_on: endsOn,
  };
  // A trip being created is compared against nothing stored, so any title at
  // all is worth saving.
  const { canSave, onSubmit } = entryForm(input, NEW_TRIP, onSave, input.title !== '');

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-4">
      <TitleField value={title} onChange={setTitle} autoCapitalize="sentences" />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <FormField label="Desde">
          <DatePicker value={startsOn} onChange={setStartsOn} label="Desde" />
        </FormField>
        <FormField label="Hasta">
          <DatePicker value={endsOn} onChange={setEndsOn} label="Hasta" />
        </FormField>
      </div>

      <FormFooter submitDisabled={!canSave} />
    </form>
  );
}
