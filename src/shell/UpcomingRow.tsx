import { appHue, type Upcoming } from '../apps/types';
import { apps } from '../apps/registry';
import EntryMarks from '../components/EntryMarks';
import LinkRow from '../components/LinkRow';
import { daysUntil, relativeDay } from '../utils/dateUtils';
import { hueStyle } from '../components/hue';

interface UpcomingRowProps {
  row: Upcoming;
  today: string;
}

/** One entry coming up, whichever app it is from: the app's colour before
 *  it, its marks and its day after. */
export default function UpcomingRow({ row, today }: UpcomingRowProps) {
  const app = apps.find(({ id }) => id === row.appId);
  const past = daysUntil(today, row.on) < 0;

  return (
    <LinkRow
      to={row.to}
      title={row.title}
      leading={
        <span
          className="h-3 w-3 shrink-0 bg-(--app)"
          style={hueStyle(app ? appHue(app.id) : 'primary')}
        />
      }
      trailing={
        <>
          <EntryMarks marks={row.marks} />
          <span className={`shrink-0 text-sm ${past ? 'text-error' : 'text-muted'}`}>
            {relativeDay(today, row.on)}
          </span>
        </>
      }
    />
  );
}
