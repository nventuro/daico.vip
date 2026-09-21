import type { TripInboxItem } from '../../lib/offline/specs';
import EntryMarks from '../../components/EntryMarks';
import ItemIcon from './ItemIcon';
import { inboxItemLines } from './labels';
import { tripInboxMarks } from './marks';

interface InboxItemRowProps {
  item: TripInboxItem;
  today: string;
}

/** One suggestion, reading exactly as it would once in the trip — the same
 *  glyph, the same lines under it; a boarding pass under a glyph of its own,
 *  since it is no row of a trip — but going nowhere: a group is reviewed
 *  whole, never a row of it on its own. What the email said about it is a
 *  line more, since there is no screen of its own to read it on. */
export default function InboxItemRow({ item, today }: InboxItemRowProps) {
  const [subtitle, secondLine] = inboxItemLines(item, today);
  return (
    <li className="flex items-center gap-2 border-b border-border py-3">
      <ItemIcon kind={item.kind} transport={item.transport} />
      <span className="flex min-w-0 flex-1 flex-col">
        <span className="truncate text-on-surface">{item.title}</span>
        {subtitle !== undefined && (
          <span className="mt-0.5 truncate text-xs text-muted">{subtitle}</span>
        )}
        {secondLine !== undefined && (
          <span className="mt-0.5 truncate text-xs text-muted">{secondLine}</span>
        )}
        {item.comments !== null && (
          <span className="mt-0.5 truncate text-xs text-muted">{item.comments}</span>
        )}
      </span>
      <EntryMarks marks={tripInboxMarks(item)} />
    </li>
  );
}
