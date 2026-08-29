import type { ReactNode } from 'react';
import { IconBell, IconCalendarEvent, IconRepeat } from '@tabler/icons-react';
import {
  REPEAT_UNITS,
  repeatIntervalLabel,
  repeatLabel,
  repeatUnitsLabel,
} from '../../utils/recurrence';
import {
  CHIP_BASE_CLASS,
  CHIP_IDLE_CLASS,
  CONTROL_CLASS,
  FIELD_CLASS,
} from '../../components/controlClasses';
import DatePicker from '../../components/DatePicker';
import NoticeDaysSelect from '../../components/NoticeDaysSelect';
import Select from '../../components/Select';
import TextInput from '../../components/TextInput';
import type { DateInput } from './useDates';

/** Notice windows (days ahead) offered when adding or editing a date. */
const DATE_NOTICE_DAYS_OPTIONS = [0, 1, 3, 7, 14, 30] as const;

/** Interval a date gets when it is switched to repeating. */
const DATE_REPEAT_EVERY_DEFAULT = 1;

/** Bounds for a date's interval (input guard). */
const DATE_REPEAT_EVERY_MIN = 1;
const DATE_REPEAT_EVERY_MAX = 24;

/** What the repeat select says for a date that only happens once. */
const ONCE = 'none';

/** The scheduling half of a date: when, how it repeats, and the notice window. */
export type DateFieldsValue = Pick<
  DateInput,
  'occurs_on' | 'repeat_every' | 'repeat_unit' | 'notice_days'
>;

interface DateFieldsProps {
  fields: DateFieldsValue;
  onChange: (patch: Partial<DateFieldsValue>) => void;
  /** `chips`: compact pills for the add bar; `form`: labelled stacked fields. */
  layout: 'chips' | 'form';
}

const CHIP = `${CHIP_BASE_CLASS} ${CHIP_IDLE_CLASS}`;
const CHIP_CONTROL = 'bg-transparent text-sm text-muted-strong outline-none';

/** The date, repeat and notice controls shared by the add bar and the edit
 *  form. Controlled: every change is reported as a patch of the value. */
export default function DateFields({ fields, onChange, layout }: DateFieldsProps) {
  const chips = layout === 'chips';
  const control = chips ? CHIP_CONTROL : CONTROL_CLASS;
  const every = fields.repeat_every ?? DATE_REPEAT_EVERY_DEFAULT;

  function field(label: string, icon: ReactNode, input: ReactNode) {
    return (
      <label className={chips ? CHIP : FIELD_CLASS}>
        {chips ? icon : <span>{label}</span>}
        {input}
      </label>
    );
  }

  function changeUnit(value: string) {
    if (value === ONCE) {
      onChange({ repeat_every: null, repeat_unit: null });
      return;
    }
    const unit = REPEAT_UNITS.find((u) => u === value);
    if (unit) onChange({ repeat_every: every, repeat_unit: unit });
  }

  return (
    <>
      {field(
        'Fecha',
        <IconCalendarEvent size={18} stroke={1.5} />,
        <DatePicker
          value={fields.occurs_on}
          onChange={(value) => {
            if (value) onChange({ occurs_on: value });
          }}
          label="Fecha"
          required
          className={control}
        />,
      )}
      {field(
        'Repetición',
        <IconRepeat size={18} stroke={1.5} />,
        <Select
          value={fields.repeat_unit ?? ONCE}
          onChange={(e) => changeUnit(e.target.value)}
          aria-label="Repetición"
          className={control}
        >
          <option value={ONCE}>Una vez</option>
          {REPEAT_UNITS.map((unit) => (
            <option key={unit} value={unit}>
              {repeatLabel(every, unit)}
            </option>
          ))}
        </Select>,
      )}
      {fields.repeat_unit !== null &&
        field(
          repeatIntervalLabel(fields.repeat_unit),
          <span>Cada</span>,
          <span className="flex items-center gap-1.5">
            <TextInput
              type="number"
              inputMode="numeric"
              min={DATE_REPEAT_EVERY_MIN}
              max={DATE_REPEAT_EVERY_MAX}
              required
              value={fields.repeat_every ?? ''}
              onChange={(e) => {
                const n = e.target.valueAsNumber;
                onChange({ repeat_every: Number.isFinite(n) ? n : null });
              }}
              aria-label={repeatIntervalLabel(fields.repeat_unit)}
              className={`${control} ${chips ? 'w-12' : 'w-24'}`}
            />
            {chips && <span>{repeatUnitsLabel(fields.repeat_unit)}</span>}
          </span>,
        )}
      {field(
        'Aviso',
        <IconBell size={18} stroke={1.5} />,
        <NoticeDaysSelect
          value={fields.notice_days}
          onChange={(days) => onChange({ notice_days: days })}
          options={DATE_NOTICE_DAYS_OPTIONS}
          className={control}
        />,
      )}
    </>
  );
}
