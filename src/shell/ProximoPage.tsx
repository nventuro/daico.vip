import { groupByDay } from '../lib/upcoming';
import { todayIso } from '../utils/dateUtils';
import UpcomingRow from './UpcomingRow';
import UpcomingRows from './UpcomingRows';

/** Everything coming up across the apps, grouped by day. */
export default function ProximoPage() {
  const today = todayIso();

  return (
    <UpcomingRows>
      {(rows, ready) => {
        if (!ready) return <p className="text-muted">Cargando...</p>;
        if (rows.length === 0) {
          return <p className="py-10 text-center text-muted">No hay nada por delante.</p>;
        }
        return groupByDay(rows, today).map((group) => (
          <section key={group.key} className="mb-6">
            <h2
              className={`mb-2 text-xs font-semibold tracking-wide uppercase ${
                group.overdue ? 'text-error' : 'text-muted'
              }`}
            >
              {group.label}
            </h2>
            <ul className="divide-y divide-border overflow-hidden rounded-xl border border-border bg-surface-raised">
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
