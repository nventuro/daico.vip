import { useState } from 'react';
import { REPEAT_UNITS, repeatIntervalLabel, repeatLabel } from '../../utils/recurrence';
import { formatDayMonth } from '../../utils/dateUtils';
import FormField from '../../components/FormField';
import Select from '../../components/Select';
import TextInput from '../../components/TextInput';
import type { CheckupInput } from './useCheckups';

/** Interval a checkup gets when it is switched to repeating. */
const CHECKUP_REPEAT_EVERY_DEFAULT = 1;

/** Bounds for a checkup's interval (input guard). */
const CHECKUP_REPEAT_EVERY_MIN = 1;
const CHECKUP_REPEAT_EVERY_MAX = 99;

/** What the repeat select says for a checkup done once. */
const ONCE = 'none';

/** The repeat half of a checkup: whether it comes back, and how often. */
export type RepeatValue = Pick<CheckupInput, 'repeat_every' | 'repeat_unit'>;

interface RepeatFieldsProps {
  value: RepeatValue;
  onChange: (patch: RepeatValue) => void;
  /** The day it was last marked, said under the interval when there is one. */
  lastDoneOn: string | null;
}

/** How a checkup repeats: the unit, and how many of them go by — always
 *  counted from the day it was marked, which the line underneath says, since
 *  there is nothing to choose about it. Controlled, every change reported
 *  whole except the interval, reported once it is left: half of a number is
 *  no interval at all. */
export default function RepeatFields({ value, onChange, lastDoneOn }: RepeatFieldsProps) {
  const { repeat_every: every, repeat_unit: unit } = value;
  // The interval as it is being typed; null while it is not.
  const [typed, setTyped] = useState<string | null>(null);

  function changeUnit(picked: string) {
    if (picked === ONCE) {
      onChange({ repeat_every: null, repeat_unit: null });
      return;
    }
    const next = REPEAT_UNITS.find((u) => u === picked);
    if (next) onChange({ repeat_every: every ?? CHECKUP_REPEAT_EVERY_DEFAULT, repeat_unit: next });
  }

  function leaveInterval() {
    if (typed === null) return;
    setTyped(null);
    const n = Number.parseInt(typed, 10);
    if (Number.isInteger(n) && n >= CHECKUP_REPEAT_EVERY_MIN) {
      onChange({ ...value, repeat_every: Math.min(n, CHECKUP_REPEAT_EVERY_MAX) });
    }
  }

  return (
    <>
      <FormField label="Repetición">
        <Select value={unit ?? ONCE} onChange={(e) => changeUnit(e.target.value)}>
          <option value={ONCE}>No se repite</option>
          {REPEAT_UNITS.map((u) => (
            <option key={u} value={u}>
              {repeatLabel(every ?? CHECKUP_REPEAT_EVERY_DEFAULT, u)}
            </option>
          ))}
        </Select>
      </FormField>

      {unit !== null && (
        <FormField label={repeatIntervalLabel(unit)} group>
          <TextInput
            type="number"
            inputMode="numeric"
            min={CHECKUP_REPEAT_EVERY_MIN}
            max={CHECKUP_REPEAT_EVERY_MAX}
            required
            value={typed ?? every ?? ''}
            onChange={(e) => setTyped(e.target.value)}
            onBlur={leaveInterval}
            aria-label={repeatIntervalLabel(unit)}
          />
          <p className="text-xs text-muted">
            El próximo se cuenta desde el día que lo marcás.
            {lastDoneOn && ` Última vez el ${formatDayMonth(lastDoneOn)}.`}
          </p>
        </FormField>
      )}
    </>
  );
}
