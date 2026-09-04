import type { TripInboxItem } from '../../lib/offline/specs';
import EntryMarks from '../../components/EntryMarks';
import { TRIP_KIND_SHAPES } from './kinds';
import { itemSubtitle } from './labels';
import { tripInboxMarks } from './marks';

interface InboxItemRowProps {
  item: TripInboxItem;
  today: string;
}

/** One suggestion, reading exactly as it would once in the trip — the same
 *  glyph, the same line under it — but going nowhere: a group is reviewed
 *  whole, never a row of it on its own. What the email said about it is a
 *  third line, since there is no screen of its own to read it on. */
export default function InboxItemRow({ item, today }: InboxItemRowProps) {
  const { icon: Icon } = TRIP_KIND_SHAPES[item.kind];
  const subtitle = itemSubtitle({ ...item, trip_id: '', done: false }, today);
  return (
    <li className="flex items-center gap-2 border-b border-border py-3">
      <Icon size={18} stroke={1.5} className="shrink-0 text-muted" />
      <span className="flex min-w-0 flex-1 flex-col">
        <span className="truncate text-on-surface">{item.title}</span>
        {subtitle !== undefined && (
          <span className="mt-0.5 truncate text-xs text-muted">{subtitle}</span>
        )}
        {item.comments !== null && (
          <span className="mt-0.5 truncate text-xs text-muted">{item.comments}</span>
        )}
      </span>
      <EntryMarks marks={tripInboxMarks(item)} />
    </li>
  );
}
