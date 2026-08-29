import { noticeLabel } from '../utils/dateUtils';
import Select from './Select';

interface NoticeDaysSelectProps {
  value: number;
  onChange: (days: number) => void;
  /** The windows this app offers, in days ahead. */
  options: readonly number[];
  className?: string;
}

/** How far ahead an entry announces itself on the home screen. */
export default function NoticeDaysSelect({
  value,
  onChange,
  options,
  className,
}: NoticeDaysSelectProps) {
  return (
    <Select
      value={value}
      onChange={(e) => onChange(Number(e.target.value))}
      aria-label="Aviso"
      className={className}
    >
      {options.map((days) => (
        <option key={days} value={days}>
          {noticeLabel(days)}
        </option>
      ))}
    </Select>
  );
}
