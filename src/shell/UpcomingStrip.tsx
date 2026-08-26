import { useCallback, useState } from 'react';
import type { AppId, Upcoming } from '../apps/types';
import { apps } from '../apps/registry';
import { sameUpcoming, sortUpcoming } from '../lib/upcoming';
import { todayIso } from '../utils/dateUtils';
import UpcomingRow from './UpcomingRow';
import UpcomingSource from './UpcomingSource';

/** The "Próximo" list on the home screen: every app's upcoming entries merged
 *  into one date-ordered list. Hidden while there is nothing to show. */
export default function UpcomingStrip() {
  const [byApp, setByApp] = useState<Partial<Record<AppId, Upcoming[]>>>({});

  // Bail out by value: a source re-reports the same entries after every one of
  // its renders, and taking a fresh object each time would re-render it again.
  const onItems = useCallback((appId: AppId, items: Upcoming[]) => {
    setByApp((prev) =>
      sameUpcoming(prev[appId] ?? [], items) ? prev : { ...prev, [appId]: items },
    );
  }, []);

  const rows = sortUpcoming(Object.values(byApp).flatMap((items) => items ?? []));
  const today = todayIso();

  return (
    <>
      {apps.map((m) =>
        m.useUpcoming ? (
          <UpcomingSource key={m.id} appId={m.id} useUpcoming={m.useUpcoming} onItems={onItems} />
        ) : null,
      )}
      {rows.length > 0 && (
        <section className="mb-6">
          <h2 className="mb-2 text-xs font-semibold tracking-wide text-muted uppercase">Próximo</h2>
          <ul className="divide-y divide-border overflow-hidden rounded-xl border border-border bg-surface-raised">
            {rows.map((row, i) => (
              <UpcomingRow key={i} row={row} today={today} />
            ))}
          </ul>
        </section>
      )}
    </>
  );
}
