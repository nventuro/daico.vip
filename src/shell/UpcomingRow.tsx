import { Link } from 'react-router-dom';
import type { Upcoming } from '../apps/types';
import { apps } from '../apps/registry';
import { daysUntil, relativeDay } from '../utils/dateUtils';
import { hueStyle } from './hue';

export default function UpcomingRow({ row, today }: { row: Upcoming; today: string }) {
  const app = apps.find((m) => m.id === row.appId);
  const past = daysUntil(today, row.on) < 0;

  return (
    <li>
      <Link
        to={row.to}
        className="flex items-center gap-3 px-4 py-3 transition-colors hover:bg-border-subtle"
      >
        <span
          className="h-2.5 w-2.5 shrink-0 rounded-full bg-(--app)"
          style={hueStyle(app?.hue ?? 'primary')}
        />
        <span className="min-w-0 flex-1 truncate">{row.title}</span>
        <span className={`shrink-0 text-sm ${past ? 'text-error' : 'text-muted'}`}>
          {relativeDay(today, row.on)}
        </span>
      </Link>
    </li>
  );
}
