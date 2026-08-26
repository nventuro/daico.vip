import { Link } from 'react-router-dom';
import { IconRepeat, IconX } from '@tabler/icons-react';
import type { DateEntry } from '../../types';
import { formatDayMonth, relativeDay } from '../../utils/dateUtils';
import { displayDate } from './recurrence';

interface DateRowProps {
  entry: DateEntry;
  today: string;
  onRemove: () => void;
}

/** One date in the list: the row opens the entry, the trailing button deletes it. */
export default function DateRow({ entry, today, onRemove }: DateRowProps) {
  const date = displayDate(entry, today);
  const past = date < today;

  return (
    <li className="flex items-stretch rounded-xl border border-border bg-surface-raised shadow-sm">
      <Link to={`/fechas/${entry.id}`} className="flex min-w-0 flex-1 flex-col py-3 pl-4">
        <span className="truncate text-on-surface">{entry.title}</span>
        <span
          className={`mt-0.5 inline-flex items-center gap-1 text-xs ${past ? 'text-error' : 'text-muted'}`}
        >
          {formatDayMonth(date)} · {relativeDay(today, date)}
          {entry.repeat !== 'none' && <IconRepeat size={13} stroke={1.5} />}
        </span>
      </Link>
      <button
        onClick={onRemove}
        aria-label="Eliminar fecha"
        title="Eliminar fecha"
        className="flex shrink-0 items-center px-3 text-muted transition-colors hover:text-error"
      >
        <IconX size={18} stroke={1.5} />
      </button>
    </li>
  );
}
