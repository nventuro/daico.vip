import { useState } from 'react';
import type { Trip } from '../../lib/offline/specs';
import { entryForm } from '../../utils/formUtils';
import DatePicker from '../../components/DatePicker';
import FormField from '../../components/FormField';
import FormFooter from '../../components/FormFooter';
import TitleField from '../../components/TitleField';
import { NEW_TRIP, type TripInput } from './useTrips';

interface TripFormProps {
  /** The trip being edited, or a new one carrying only its title. A trip is
   *  written on save, so one being created has no id yet and nothing to
   *  delete. */
  trip: Trip | TripInput;
  onSave: (input: TripInput) => void;
  /** The trip's own delete; a trip that does not exist yet has none. */
  onRemove?: () => void;
}

/** Edits a trip: its title and the days it covers, which are stored rather
 *  than derived from what is booked on it. Keyed by the trip's id by its
 *  caller, so the local draft starts from it once and never chases it. */
export default function TripForm({ trip, onSave, onRemove }: TripFormProps) {
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
  const saved = 'id' in trip ? trip : NEW_TRIP;
  const { canSave, onSubmit } = entryForm(input, saved, onSave, input.title !== '');

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-4">
      <TitleField value={title} onChange={setTitle} />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <FormField label="Desde">
          <DatePicker value={startsOn} onChange={setStartsOn} label="Desde" />
        </FormField>
        <FormField label="Hasta">
          <DatePicker value={endsOn} onChange={setEndsOn} label="Hasta" />
        </FormField>
      </div>

      <FormFooter
        removeLabel={onRemove && 'Eliminar viaje'}
        confirmQuestion={onRemove && '¿Eliminar el viaje?'}
        onRemove={onRemove}
        submitDisabled={!canSave}
      />
    </form>
  );
}
