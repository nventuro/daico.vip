import { useState } from 'react';
import { REPEAT_UNITS, repeatIntervalLabel, repeatLabel } from '../../utils/recurrence';
import DatePicker from '../../components/DatePicker';
import FormField from '../../components/FormField';
import Select from '../../components/Select';
import TextInput from '../../components/TextInput';
import type { DateInput } from './useDates';

/** Interval a date gets when it is switched to repeating. */
const DATE_REPEAT_EVERY_DEFAULT = 1;

/** Bounds for a date's interval (input guard). */
const DATE_REPEAT_EVERY_MIN = 1;
const DATE_REPEAT_EVERY_MAX = 99;

/** What the repeat select says for a date that only happens once. */
const ONCE = 'none';

/** The scheduling half of a date: when, and how it repeats. */
export type DateFieldsValue = Pick<DateInput, 'occurs_on' | 'repeat_every' | 'repeat_unit'>;

interface DateFieldsProps {
  fields: DateFieldsValue;
  onChange: (patch: Partial<DateFieldsValue>) => void;
}

/** The date and repeat controls a date is set by. Controlled: every
 *  change is reported as a patch of the value — except the interval, reported
 *  once it is left: half of a number is no interval at all. */
export default function DateFields({ fields, onChange }: DateFieldsProps) {
  const every = fields.repeat_every ?? DATE_REPEAT_EVERY_DEFAULT;
  // The interval as it is being typed; null while it is not.
  const [typed, setTyped] = useState<string | null>(null);

  function changeUnit(value: string) {
    if (value === ONCE) {
      onChange({ repeat_every: null, repeat_unit: null });
      return;
    }
    const unit = REPEAT_UNITS.find((u) => u === value);
    if (unit) onChange({ repeat_every: every, repeat_unit: unit });
  }

  function leaveInterval() {
    if (typed === null) return;
    setTyped(null);
    const n = Number.parseInt(typed, 10);
    if (Number.isInteger(n) && n >= DATE_REPEAT_EVERY_MIN) {
      onChange({ repeat_every: Math.min(n, DATE_REPEAT_EVERY_MAX) });
    }
  }

  return (
    <>
      <FormField label="Fecha">
        <DatePicker
          value={fields.occurs_on}
          onChange={(value) => {
            if (value) onChange({ occurs_on: value });
          }}
          label="Fecha"
          required
        />
      </FormField>
      <FormField label="Repetición">
        <Select
          value={fields.repeat_unit ?? ONCE}
          onChange={(e) => changeUnit(e.target.value)}
          aria-label="Repetición"
        >
          <option value={ONCE}>Una vez</option>
          {REPEAT_UNITS.map((unit) => (
            <option key={unit} value={unit}>
              {repeatLabel(every, unit)}
            </option>
          ))}
        </Select>
      </FormField>
      {fields.repeat_unit !== null && (
        <FormField label={repeatIntervalLabel(fields.repeat_unit)}>
          <TextInput
            type="number"
            inputMode="numeric"
            min={DATE_REPEAT_EVERY_MIN}
            max={DATE_REPEAT_EVERY_MAX}
            value={typed ?? fields.repeat_every ?? ''}
            onChange={(e) => setTyped(e.target.value)}
            onBlur={leaveInterval}
            aria-label={repeatIntervalLabel(fields.repeat_unit)}
          />
        </FormField>
      )}
    </>
  );
}
