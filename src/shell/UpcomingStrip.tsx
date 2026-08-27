import { Link } from 'react-router-dom';
import { IconChevronRight } from '@tabler/icons-react';
import { UPCOMING_MAX_ROWS } from '../types';
import { todayIso } from '../utils/dateUtils';
import UpcomingRow from './UpcomingRow';
import UpcomingRows from './UpcomingRows';

/** The "Próximo" list on the home screen: the first few of every app's
 *  upcoming entries, soonest first, with a link to the full list when there
 *  are more. Hidden while there is nothing to show. */
export default function UpcomingStrip() {
  const today = todayIso();

  return (
    <UpcomingRows>
      {(rows) =>
        rows.length > 0 && (
          <section className="mb-6">
            <h2 className="mb-2 text-xs font-semibold tracking-wide text-muted uppercase">Próximo</h2>
            <ul className="divide-y divide-border overflow-hidden rounded-xl border border-border bg-surface-raised">
              {rows.slice(0, UPCOMING_MAX_ROWS).map((row, i) => (
                <UpcomingRow key={i} row={row} today={today} />
              ))}
              {rows.length > UPCOMING_MAX_ROWS && (
                <li>
                  <Link
                    to="/proximo"
                    className="flex items-center justify-center gap-1 px-4 py-3 text-sm font-medium text-primary transition-colors hover:bg-border-subtle"
                  >
                    Ver todo
                    <IconChevronRight size={16} stroke={2} />
                  </Link>
                </li>
              )}
            </ul>
          </section>
        )
      }
    </UpcomingRows>
  );
}
