import type { TripItem } from '../../lib/offline/specs';
import { isPast } from '../../utils/dateUtils';
import ChecklistItem from '../../components/ChecklistItem';
import EntryMarks from '../../components/EntryMarks';
import LinkRow from '../../components/LinkRow';
import { entryPath } from '../types';
import { TRIP_KIND_SHAPES } from './kinds';
import { itemSubtitle } from './labels';
import { tripItemMarks } from './marks';

interface ItemRowProps {
  item: TripItem;
  today: string;
  hasAttachments: boolean;
  onToggle: () => void;
}

/** One row of a trip: a pendiente is ticked off where it stands, everything
 *  booked only opens — nothing is ticked as the trip happens. */
export default function ItemRow({ item, today, hasAttachments, onToggle }: ItemRowProps) {
  const { icon: Icon, ticked } = TRIP_KIND_SHAPES[item.kind];
  const marks = <EntryMarks marks={tripItemMarks(item, hasAttachments)} />;
  const subtitle = itemSubtitle(item, today);
  const to = entryPath('viajes', item.trip_id, item.id);

  if (ticked) {
    return (
      <ChecklistItem
        checked={item.done}
        label={item.title}
        to={to}
        subtitle={subtitle}
        overdue={!item.done && item.on_date !== null && isPast(item.on_date, today)}
        trailing={marks}
        onToggle={onToggle}
        toggleLabel={item.done ? 'Marcar como pendiente' : 'Marcar como hecho'}
      />
    );
  }

  return (
    <LinkRow
      to={to}
      title={item.title}
      subtitle={subtitle}
      leading={<Icon size={18} stroke={1.5} className="shrink-0 text-muted" />}
      trailing={marks}
    />
  );
}
