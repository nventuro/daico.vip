import { groupByDay, upcomingKey } from './upcoming';
import EmptyState from '../components/EmptyState';
import SectionLabel from '../components/SectionLabel';
import UpcomingRow from './UpcomingRow';
import UpcomingRows from './UpcomingRows';
import SkeletonRows from '../components/SkeletonRows';
import { useToday } from '../hooks/useToday';

/** Everything coming up across the apps, grouped by day. */
export default function ProximoPage() {
  const today = useToday();

  return (
    <UpcomingRows>
      {(rows, ready) => {
        if (!ready) return <SkeletonRows leading="square" trailing />;
        if (rows.length === 0) {
          return <EmptyState>No hay nada por delante.</EmptyState>;
        }
        return groupByDay(rows, today).map((group) => (
          <section key={group.key} className="mb-6">
            <SectionLabel className={group.overdue ? 'text-error' : 'text-muted'}>
              {group.label}
            </SectionLabel>
            <ul>
              {group.rows.map((row) => (
                <UpcomingRow key={upcomingKey(row)} row={row} today={today} />
              ))}
            </ul>
          </section>
        ));
      }}
    </UpcomingRows>
  );
}
