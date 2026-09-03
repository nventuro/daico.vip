import { useState } from 'react';
import type { RepeatFrom } from '../../lib/offline/specs';
import { REPEAT_UNITS, repeatIntervalLabel, repeatLabel } from '../../utils/recurrence';
import { formatDayMonth } from '../../utils/dateUtils';
import Chip from '../../components/Chip';
import FormField from '../../components/FormField';
import Select from '../../components/Select';
import TextInput from '../../components/TextInput';
import type { ChoreInput } from './useChores';

/** Interval a chore gets when it is switched to repeating. */
const CHORE_REPEAT_EVERY_DEFAULT = 1;

/** Bounds for a chore's interval (input guard). */
const CHORE_REPEAT_EVERY_MIN = 1;
const CHORE_REPEAT_EVERY_MAX = 99;

/** Where a chore starts when it is first set to repeat: most chores that come
 *  back come back because of when they were last done, not because of a date. */
const CHORE_REPEAT_FROM_DEFAULT: RepeatFrom = 'done';

/** What the repeat select says for a chore that is done once and finished. */
const ONCE = 'none';

/** How each way of counting the next one reads on its chip, and underneath. */
const FROM: Record<RepeatFrom, { chip: string; explains: string }> = {
  due: {
    chip: 'En fecha fija',
    explains: 'La próxima se cuenta desde la fecha de arriba, no desde el día que la marcás.',
  },
  done: {
    chip: 'Después de hacerla',
    explains: 'La próxima se cuenta desde el día que la marcás, no desde la fecha de arriba.',
  },
};

/** The repeat half of a chore: whether it comes back, how often, and what the
 *  next date is counted from. */
export type RepeatValue = Pick<ChoreInput, 'repeat_every' | 'repeat_unit' | 'repeat_from'>;

interface RepeatFieldsProps {
  value: RepeatValue;
  onChange: (patch: RepeatValue) => void;
  /** The day it was last marked, said under the explanation when there is one. */
  lastDoneOn: string | null;
}

/** How a chore repeats, as the three fields that only exist once it does: the
 *  unit, how many of them go by, and which end the next date is counted from.
 *  Controlled, and every change is reported whole — except the interval,
 *  reported once it is left: half of a number is no interval at all. */
export default function RepeatFields({ value, onChange, lastDoneOn }: RepeatFieldsProps) {
  const { repeat_every: every, repeat_unit: unit, repeat_from: from } = value;
  // The interval as it is being typed; null while it is not.
  const [typed, setTyped] = useState<string | null>(null);

  function changeUnit(picked: string) {
    if (picked === ONCE) {
      onChange({ repeat_every: null, repeat_unit: null, repeat_from: null });
      return;
    }
    const next = REPEAT_UNITS.find((u) => u === picked);
    if (!next) return;
    onChange({
      repeat_every: every ?? CHORE_REPEAT_EVERY_DEFAULT,
      repeat_unit: next,
      repeat_from: from ?? CHORE_REPEAT_FROM_DEFAULT,
    });
  }

  function leaveInterval() {
    if (typed === null) return;
    setTyped(null);
    const n = Number.parseInt(typed, 10);
    if (Number.isInteger(n) && n >= CHORE_REPEAT_EVERY_MIN) {
      onChange({ ...value, repeat_every: Math.min(n, CHORE_REPEAT_EVERY_MAX) });
    }
  }

  return (
    <>
      <FormField label="Repetición">
        <Select value={unit ?? ONCE} onChange={(e) => changeUnit(e.target.value)}>
          <option value={ONCE}>No se repite</option>
          {REPEAT_UNITS.map((u) => (
            <option key={u} value={u}>
              {repeatLabel(every ?? CHORE_REPEAT_EVERY_DEFAULT, u)}
            </option>
          ))}
        </Select>
      </FormField>

      {unit !== null && (
        <>
          <FormField label={repeatIntervalLabel(unit)}>
            <TextInput
              type="number"
              inputMode="numeric"
              min={CHORE_REPEAT_EVERY_MIN}
              max={CHORE_REPEAT_EVERY_MAX}
              required
              value={typed ?? every ?? ''}
              onChange={(e) => setTyped(e.target.value)}
              onBlur={leaveInterval}
              aria-label={repeatIntervalLabel(unit)}
            />
          </FormField>

          <FormField label="Cuándo vuelve" group>
            <div className="flex flex-wrap items-center gap-2">
              {(Object.keys(FROM) as RepeatFrom[]).map((option) => (
                <Chip
                  key={option}
                  selected={from === option}
                  onClick={() => onChange({ ...value, repeat_from: option })}
                >
                  {FROM[option].chip}
                </Chip>
              ))}
            </div>
            <p className="text-xs text-muted">
              {FROM[from ?? CHORE_REPEAT_FROM_DEFAULT].explains}
              {lastDoneOn && ` Última vez el ${formatDayMonth(lastDoneOn)}.`}
            </p>
          </FormField>
        </>
      )}
    </>
  );
}
