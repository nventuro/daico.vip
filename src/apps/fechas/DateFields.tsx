import type { ReactNode } from 'react';
import { IconBell, IconCalendarEvent, IconRepeat } from '@tabler/icons-react';
import {
  DATE_NOTICE_DAYS_OPTIONS,
  DATE_REPEAT_MONTHS_DEFAULT,
  DATE_REPEAT_MONTHS_MAX,
  DATE_REPEAT_MONTHS_MIN,
  REPEAT_KINDS,
  type RepeatKind,
} from '../../types';
import {
  CHIP_BASE_CLASS,
  CHIP_IDLE_CLASS,
  CONTROL_CLASS,
  FIELD_CLASS,
} from '../../components/controlClasses';
import type { DateInput } from './useDates';
import { noticeLabel, repeatLabel } from './labels';

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

/** The date, repeat and notice controls shared by the add bar and the edit
 *  form. Controlled: every change is reported as a patch of the value. */
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
        <input
          type="date"
          value={occursOn}
          onChange={(e) => onChange({ occurs_on: e.target.value })}
          aria-label="Fecha"
          required
          className={control}
        />,
      )}
      {field(
        'Repetición',
        <IconRepeat size={18} stroke={1.5} />,
        <select
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
        </select>,
      )}
      {repeat === 'months' &&
        field(
          'Cada cuántos meses',
          <span>Cada</span>,
          <span className="flex items-center gap-1.5">
            <input
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
        <select
          value={noticeDays}
          onChange={(e) => onChange({ notice_days: Number(e.target.value) })}
          aria-label="Aviso"
          className={control}
        >
          {DATE_NOTICE_DAYS_OPTIONS.map((days) => (
            <option key={days} value={days}>
              {noticeLabel(days)}
            </option>
          ))}
        </select>,
      )}
    </>
  );
}
