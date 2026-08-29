import type { ReactNode } from 'react';
import { IconBell, IconCalendarEvent, IconRepeat } from '@tabler/icons-react';
import { REPEAT_KINDS, type RepeatKind } from '../../lib/offline/specs';
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
import { repeatLabel } from './labels';

/** Notice windows (days ahead) offered when adding or editing a date. */
const DATE_NOTICE_DAYS_OPTIONS = [0, 1, 3, 7, 14, 30] as const;

/** Interval a date gets when switched to repeating every N months. */
const DATE_REPEAT_MONTHS_DEFAULT = 3;

/** Bounds for a date's every-N-months interval (input guard). */
const DATE_REPEAT_MONTHS_MIN = 1;
const DATE_REPEAT_MONTHS_MAX = 24;

/** The scheduling half of a date: when, how it repeats, and the notice window. */
export type DateFieldsValue = Pick<
  DateInput,
  'occurs_on' | 'repeat' | 'repeat_months' | 'notice_days'
>;

interface DateFieldsProps {
  occursOn: string;
  repeat: RepeatKind;
  repeatMonths: number | null;
  noticeDays: number;
  onChange: (patch: Partial<DateFieldsValue>) => void;
  /** `chips`: compact pills for the add bar; `form`: labelled stacked fields. */
  layout: 'chips' | 'form';
}

const CHIP = `${CHIP_BASE_CLASS} ${CHIP_IDLE_CLASS}`;
const CHIP_CONTROL = 'bg-transparent text-sm text-muted-strong outline-none';

/** The date, repeat and notice controls of a dated entry. Controlled: every
 *  change is reported as a patch of the value. */
export default function DateFields({
  occursOn,
  repeat,
  repeatMonths,
  noticeDays,
  onChange,
  layout,
}: DateFieldsProps) {
  const chips = layout === 'chips';
  const control = chips ? CHIP_CONTROL : CONTROL_CLASS;

  function field(label: string, icon: ReactNode, input: ReactNode) {
    return (
      <label className={chips ? CHIP : FIELD_CLASS}>
        {chips ? icon : <span>{label}</span>}
        {input}
      </label>
    );
  }

  function changeRepeat(value: string) {
    const kind = REPEAT_KINDS.find((k) => k === value);
    if (!kind) return;
    onChange({
      repeat: kind,
      repeat_months: kind === 'months' ? (repeatMonths ?? DATE_REPEAT_MONTHS_DEFAULT) : null,
    });
  }

  return (
    <>
      {field(
        'Fecha',
        <IconCalendarEvent size={18} stroke={1.5} />,
        <DatePicker
          value={occursOn}
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
          value={repeat}
          onChange={(e) => changeRepeat(e.target.value)}
          aria-label="Repetición"
          className={control}
        >
          {REPEAT_KINDS.map((kind) => (
            <option key={kind} value={kind}>
              {repeatLabel(kind, repeatMonths ?? DATE_REPEAT_MONTHS_DEFAULT)}
            </option>
          ))}
        </Select>,
      )}
      {repeat === 'months' &&
        field(
          'Cada cuántos meses',
          <span>Cada</span>,
          <span className="flex items-center gap-1.5">
            <TextInput
              type="number"
              inputMode="numeric"
              min={DATE_REPEAT_MONTHS_MIN}
              max={DATE_REPEAT_MONTHS_MAX}
              required
              value={repeatMonths ?? ''}
              onChange={(e) => {
                const n = e.target.valueAsNumber;
                onChange({ repeat_months: Number.isFinite(n) ? n : null });
              }}
              aria-label="Cada cuántos meses"
              className={`${control} ${chips ? 'w-12' : 'w-24'}`}
            />
            {chips && <span>meses</span>}
          </span>,
        )}
      {field(
        'Aviso',
        <IconBell size={18} stroke={1.5} />,
        <NoticeDaysSelect
          value={noticeDays}
          onChange={(days) => onChange({ notice_days: days })}
          options={DATE_NOTICE_DAYS_OPTIONS}
          className={control}
        />,
      )}
    </>
  );
}
