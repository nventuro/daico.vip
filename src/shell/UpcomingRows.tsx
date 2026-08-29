import { useCallback, useState, type ReactNode } from 'react';
import type { AppId, Upcoming } from '../apps/types';
import { apps } from '../apps/registry';
import { sortUpcoming, withReport } from './upcoming';
import UpcomingSource from './UpcomingSource';

interface UpcomingRowsProps {
  /** Rendered with every app's entries merged soonest-first; `ready` turns true
   *  once every app has reported, so an empty list can be told from a pending one. */
  children: (rows: Upcoming[], ready: boolean) => ReactNode;
}

/** Gathers the upcoming entries of every app into one date-ordered list, for
 *  whichever screen wants to show it. Each app's `useUpcoming` runs in its own
 *  keyed source component, so hook order never depends on the registry. */
export default function UpcomingRows({ children }: UpcomingRowsProps) {
  const [byApp, setByApp] = useState<Partial<Record<AppId, Upcoming[]>>>({});

  // Bail out by value: a source re-reports the same entries after every one of
  // its renders, and taking a fresh object each time would re-render it again.
  const onItems = useCallback((appId: AppId, items: Upcoming[]) => {
    setByApp((prev) => withReport(prev, appId, items));
  }, []);

  const sources = apps.filter((app) => app.useUpcoming);
  const rows = sortUpcoming(Object.values(byApp).flatMap((items) => items ?? []));
  const ready = sources.every((app) => app.id in byApp);

  return (
    <>
      {sources.map((app) =>
        app.useUpcoming ? (
          <UpcomingSource
            key={app.id}
            appId={app.id}
            useUpcoming={app.useUpcoming}
            onItems={onItems}
          />
        ) : null,
      )}
      {children(rows, ready)}
    </>
  );
}
