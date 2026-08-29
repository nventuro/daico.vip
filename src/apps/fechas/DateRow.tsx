import type { DateEntry } from '../../lib/offline/specs';
import {
  RELATIVE_DAY_LIMIT,
  daysUntil,
  formatDayMonth,
  isPast,
  relativeDay,
} from '../../utils/dateUtils';
import EntryMarks from '../../components/EntryMarks';
import LinkRow from '../../components/LinkRow';
import { entryPath } from '../types';
import { displayDate } from './recurrence';
import { dateMarks } from './marks';

interface DateRowProps {
  entry: DateEntry;
  today: string;
}

/** One date in the list; the row opens the entry, where it can be edited or deleted. */
export default function DateRow({ entry, today }: DateRowProps) {
  const date = displayDate(entry, today);
  // A nearby label ("viernes", "hace 2 días") says nothing about the calendar
  // date, so dd/mm goes with it; a far label already spells the date out.
  const near = Math.abs(daysUntil(today, date)) <= RELATIVE_DAY_LIMIT;

  return (
    <LinkRow
      to={entryPath('fechas', entry.id)}
      title={entry.title}
      subtitle={`${near ? `${formatDayMonth(date)} · ` : ''}${relativeDay(today, date)}`}
      overdue={isPast(date, today)}
      trailing={<EntryMarks marks={dateMarks(entry)} />}
    />
  );
}
