import { Link } from 'react-router-dom';
import { IconChevronRight } from '@tabler/icons-react';
import { todayIso } from '../utils/dateUtils';
import SectionLabel from '../components/SectionLabel';
import SkeletonRows from '../components/SkeletonRows';
import UpcomingRow from './UpcomingRow';
import UpcomingRows from './UpcomingRows';

/** Most upcoming entries the home screen shows before offering the full list. */
const UPCOMING_MAX_ROWS = 4;

/** Rows the strip holds its place with while the apps are still reading. */
const PENDING_ROWS = 3;

/** The "Próximo" list on the home screen: the first few of every app's
 *  upcoming entries, soonest first, with a link to the full list when there
 *  are more. Holds its place while the apps' tables are read, so the tiles
 *  under it don't move; hidden once it is known there is nothing to show. */
export default function UpcomingStrip() {
  const today = todayIso();

  return (
    <UpcomingRows>
      {(rows, ready) =>
        !ready ? (
          <section>
            <SectionLabel>Próximo</SectionLabel>
            <SkeletonRows rows={PENDING_ROWS} leading="square" trailing />
          </section>
        ) : (
          rows.length > 0 && (
            <section>
              <SectionLabel>Próximo</SectionLabel>
              <ul className="divide-y divide-border">
                {rows.slice(0, UPCOMING_MAX_ROWS).map((row, i) => (
                  <UpcomingRow key={i} row={row} today={today} />
                ))}
              </ul>
              {rows.length > UPCOMING_MAX_ROWS && (
                <Link
                  to="/proximo"
                  className="mt-2.5 flex items-center justify-end gap-1 text-sm font-medium transition-opacity hover:opacity-70"
                >
                  Ver todo
                  <IconChevronRight size={14} stroke={2.25} />
                </Link>
              )}
            </section>
          )
        )
      }
    </UpcomingRows>
  );
}
