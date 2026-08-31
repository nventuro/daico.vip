import { useMemo } from 'react';
import type { TripKind } from '../../lib/offline/specs';
import DatePicker from '../../components/DatePicker';
import FormField from '../../components/FormField';
import TimePicker from '../../components/TimePicker';
import { CONTROL_CLASS } from '../../components/controlClasses';
import AirportField from './AirportField';
import { AIRPORT_LIST_ID, airportOptionValue, airportOptions } from './airports';
import { useTripItems } from './useTripItems';
import type { TripItemFields } from './useTripItems';

/** When a row happens and where it goes: everything of it that is not words. */
export type ItemDatesValue = Pick<
  TripItemFields,
  'on_date' | 'at_time' | 'ends_on' | 'ends_at' | 'from_code' | 'to_code'
>;

interface ItemDateFieldsProps {
  kind: TripKind;
  fields: ItemDatesValue;
  onChange: (patch: Partial<ItemDatesValue>) => void;
}

/** A control that takes its share of a row rather than the width of a field. */
const AIRPORT_CLASS = `${CONTROL_CLASS} w-20`;
const DAY_CLASS = `${CONTROL_CLASS} flex-1`;
const HOUR_CLASS = `${CONTROL_CLASS} w-24`;

/**
 * The day and hour controls of one class, and a pasaje's airports. Controlled:
 * every change is reported as a patch of the value. Which controls a class
 * draws is decided here and what is stored for it in `useTripItems`, so a
 * field a class does not draw is never left holding a value.
 */
export default function ItemDateFields({ kind, fields, onChange }: ItemDateFieldsProps) {
  // The codes the household has flown through rank first, so the list opens on
  // the handful of airports it actually uses.
  const { items } = useTripItems();
  const airports = useMemo(() => airportOptions(items), [items]);

  switch (kind) {
    case 'todo':
      return (
        <FormField label="Fecha">
          <DatePicker
            value={fields.on_date}
            onChange={(value) => onChange({ on_date: value })}
            label="Fecha"
          />
        </FormField>
      );

    case 'ticket':
      // Each leg is one row of airport, day and hour: no caption of its own,
      // since three controls side by side already say which is which.
      return (
        <>
          <datalist id={AIRPORT_LIST_ID}>
            {airports.map(([code, city]) => (
              <option key={code} value={airportOptionValue(code, city)} />
            ))}
          </datalist>
          <FormField label="Salida" group>
            <div className="flex gap-2">
              <AirportField
                value={fields.from_code}
                onChange={(value) => onChange({ from_code: value })}
                label="Aeropuerto de salida"
                list={AIRPORT_LIST_ID}
                className={AIRPORT_CLASS}
              />
              <DatePicker
                value={fields.on_date}
                onChange={(value) => onChange({ on_date: value })}
                label="Día de salida"
                className={DAY_CLASS}
              />
              <TimePicker
                value={fields.at_time}
                onChange={(value) => onChange({ at_time: value })}
                label="Hora de salida"
                className={HOUR_CLASS}
              />
            </div>
          </FormField>
          <FormField label="Llegada" group>
            <div className="flex gap-2">
              <AirportField
                value={fields.to_code}
                onChange={(value) => onChange({ to_code: value })}
                label="Aeropuerto de llegada"
                list={AIRPORT_LIST_ID}
                className={AIRPORT_CLASS}
              />
              {/* The arrival day matters: without it an overnight flight reads
                  as landing before it left. */}
              <DatePicker
                value={fields.ends_on}
                onChange={(value) => onChange({ ends_on: value })}
                label="Día de llegada"
                className={DAY_CLASS}
              />
              <TimePicker
                value={fields.ends_at}
                onChange={(value) => onChange({ ends_at: value })}
                label="Hora de llegada"
                className={HOUR_CLASS}
              />
            </div>
          </FormField>
        </>
      );

    case 'lodging':
      return (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <FormField label="Desde">
            <DatePicker
              value={fields.on_date}
              onChange={(value) => onChange({ on_date: value })}
              label="Desde"
            />
          </FormField>
          <FormField label="Hasta">
            <DatePicker
              value={fields.ends_on}
              onChange={(value) => onChange({ ends_on: value })}
              label="Hasta"
            />
          </FormField>
        </div>
      );

    case 'booking':
      return (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <FormField label="Fecha">
            <DatePicker
              value={fields.on_date}
              onChange={(value) => onChange({ on_date: value })}
              label="Fecha"
            />
          </FormField>
          <FormField label="Hora">
            <TimePicker
              value={fields.at_time}
              onChange={(value) => onChange({ at_time: value })}
              label="Hora"
            />
          </FormField>
        </div>
      );

    case 'place':
      // A lugar is an idea, not a plan: with a day and an hour it is a reserva.
      return null;
  }
}
