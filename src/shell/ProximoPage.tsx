import { groupByDay } from '../lib/upcoming';
import { todayIso } from '../utils/dateUtils';
import SectionLabel from '../components/SectionLabel';
import UpcomingRow from './UpcomingRow';
import UpcomingRows from './UpcomingRows';
import SkeletonRows from '../components/SkeletonRows';

/** Everything coming up across the apps, grouped by day. */
export default function ProximoPage() {
  const today = todayIso();

  return (
    <UpcomingRows>
      {(rows, ready) => {
        if (!ready) return <SkeletonRows leading="square" trailing />;
        if (rows.length === 0) {
          return <p className="py-10 text-center text-muted">No hay nada por delante.</p>;
        }
        return groupByDay(rows, today).map((group) => (
          <section key={group.key} className="mb-6">
            <SectionLabel className={group.overdue ? 'text-error' : 'text-muted'}>
              {group.label}
            </SectionLabel>
            <ul className="divide-y divide-border">
              {group.rows.map((row, i) => (
                <UpcomingRow key={i} row={row} today={today} />
              ))}
            </ul>
          </section>
        ));
      }}
    </UpcomingRows>
  );
}
