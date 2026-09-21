import { useMemo } from 'react';
import { TRIP_TRANSPORTS, type TripKind } from '../../lib/offline/specs';
import Chip from '../../components/Chip';
import DatePicker from '../../components/DatePicker';
import FormField from '../../components/FormField';
import TimePicker from '../../components/TimePicker';
import { CONTROL_CLASS } from '../../components/controlClasses';
import AirportField from './AirportField';
import StationField from './StationField';
import { ownAirports } from './airports';
import { TRIP_TRANSPORT_DEFAULT, TRIP_TRANSPORT_ICONS } from './kinds';
import { TRIP_TRANSPORT_LABELS, TRIP_TRANSPORT_PLACES } from './labels';
import { STATION_LIST_ID, stationOptions } from './stations';
import { useTripItems } from './useTripItems';
import type { TripItemFields } from './useTripItems';

/** When a row happens, and for a pasaje what it travels on and between where:
 *  everything of it that is not words. */
export type ItemDatesValue = Pick<
  TripItemFields,
  'on_date' | 'at_time' | 'ends_on' | 'ends_at' | 'transport' | 'origin' | 'destination'
>;

interface ItemDateFieldsProps {
  kind: TripKind;
  fields: ItemDatesValue;
  onChange: (patch: Partial<ItemDatesValue>) => void;
}

/** A control that takes its share of a row rather than the width of a field. */
const DAY_CLASS = `${CONTROL_CLASS} flex-1`;
const HOUR_CLASS = `${CONTROL_CLASS} w-24`;

/**
 * The day and hour controls of one class, and what a pasaje travels on and
 * between where. Controlled: every change is reported as a patch of the value.
 * Which controls a class draws is decided here and what is stored for it in
 * `useTripItems`, so a field a class does not draw is never left holding a
 * value.
 */
export default function ItemDateFields({ kind, fields, onChange }: ItemDateFieldsProps) {
  // What the household has already travelled through ranks first, so a list
  // opens on the handful of places it actually uses.
  const { items } = useTripItems();
  const airports = useMemo(() => ownAirports(items), [items]);
  const stations = useMemo(() => stationOptions(items), [items]);

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

    case 'ticket': {
      const transport = fields.transport ?? TRIP_TRANSPORT_DEFAULT;
      const flight = transport === 'flight';
      const place = TRIP_TRANSPORT_PLACES[transport];

      // Where a leg is: an airport held as its code on a flight, a station by
      // its name otherwise. On a line of its own, since a name needs the width.
      const where = (end: 'origin' | 'destination', leg: string) => {
        const label = `${place} de ${leg}`;
        const change = (value: string | null) =>
          onChange(end === 'origin' ? { origin: value } : { destination: value });
        return flight ? (
          <AirportField value={fields[end]} onChange={change} label={label} own={airports} />
        ) : (
          <StationField
            value={fields[end]}
            onChange={change}
            label={label}
            placeholder={place}
            list={STATION_LIST_ID}
          />
        );
      };

      return (
        <>
          <div
            role="group"
            aria-label="Medio de transporte"
            className="flex flex-wrap items-center gap-2"
          >
            {TRIP_TRANSPORTS.map((option) => {
              const Icon = TRIP_TRANSPORT_ICONS[option];
              return (
                <Chip
                  key={option}
                  selected={option === transport}
                  onClick={() => onChange({ transport: option })}
                >
                  <Icon size={16} stroke={1.5} aria-hidden />
                  {TRIP_TRANSPORT_LABELS[option]}
                </Chip>
              );
            })}
          </div>
          {/* An airport's field draws its own list, from what is typed in it. */}
          {!flight && (
            <datalist id={STATION_LIST_ID}>
              {stations.map((name) => (
                <option key={name} value={name} />
              ))}
            </datalist>
          )}
          <FormField label="Salida" group>
            <div className="flex flex-col gap-2">
              {where('origin', 'salida')}
              <div className="flex gap-2">
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
            </div>
          </FormField>
          <FormField label="Llegada" group>
            <div className="flex flex-col gap-2">
              {where('destination', 'llegada')}
              <div className="flex gap-2">
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
            </div>
          </FormField>
        </>
      );
    }

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
