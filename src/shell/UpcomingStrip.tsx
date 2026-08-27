import { Link } from 'react-router-dom';
import { IconChevronRight } from '@tabler/icons-react';
import { UPCOMING_MAX_ROWS } from '../types';
import { todayIso } from '../utils/dateUtils';
import SectionLabel from '../components/SectionLabel';
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
      }
    </UpcomingRows>
  );
}
