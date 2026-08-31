import { apps } from '../apps/registry';
import { useSyncStatus } from '../hooks/useSyncStatus';
import { relativeDayTime, todayIso } from '../utils/dateUtils';
import Motif from '../components/Motif';
import OfflineBanner from '../components/OfflineBanner';
import AppTile from './AppTile';
import UpdateNotice from './UpdateNotice';
import UpcomingStrip from './UpcomingStrip';

/** Mirrors the grid's `grid-cols-2 sm:grid-cols-3`: the floor is completed
 *  with plain tiles so its last row is never left half laid, at either width. */
const COLUMNS = { narrow: 2, wide: 3 };

/** How many plain tiles complete the last row of a grid this many columns wide. */
function fillers(columns: number): number {
  return (columns - (apps.length % columns)) % columns;
}

export default function HomePage() {
  const narrow = fillers(COLUMNS.narrow);
  const wide = fillers(COLUMNS.wide);
  const { completedAt } = useSyncStatus();

  return (
    <div className="flex flex-col gap-5 pt-5">
      <UpdateNotice className="" />
      {/* With no connection, what the screen shows is as old as the last run
          that brought everything down: said here, once, for every app. */}
      <OfflineBanner className="">
        {completedAt &&
          `Sin conexión — lo último es de ${relativeDayTime(todayIso(), completedAt)}.`}
      </OfflineBanner>
      <UpcomingStrip />
      <ul className="-mx-4 grid grid-cols-2 gap-2 sm:grid-cols-3">
        {apps.map((app) => (
          <li key={app.id}>
            <AppTile app={app} />
          </li>
        ))}
        {Array.from({ length: Math.max(narrow, wide) }, (_, i) => (
          <li
            key={i}
            aria-hidden
            className={`relative aspect-square overflow-hidden text-on-surface ${
              i < narrow ? '' : 'hidden'
            } ${i < wide ? 'sm:block' : 'sm:hidden'}`}
          >
            <Motif muted />
          </li>
        ))}
      </ul>
    </div>
  );
}
