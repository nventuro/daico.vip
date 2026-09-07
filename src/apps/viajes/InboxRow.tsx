import { IconMail } from '@tabler/icons-react';
import LinkRow from '../../components/LinkRow';
import { entryPath } from '../types';
import type { InboxGroup } from './grouping';
import { groupFileIds } from './inboxConfirm';
import { inboxSubtitle } from './labels';

interface InboxRowProps {
  group: InboxGroup;
  today: string;
}

/** One email's suggestions in the list: named after the trip the model saw
 *  in it, opening the review of everything it brought — or, for a boarding
 *  pass, of the files it is. */
export default function InboxRow({ group, today }: InboxRowProps) {
  const count = group.boardingPass ? groupFileIds(group).length : group.items.length;
  return (
    <LinkRow
      to={entryPath('viajes', 'inbox', group.key)}
      title={group.tripTitle}
      subtitle={inboxSubtitle(count, group.receivedAt, today, group.boardingPass)}
      leading={<IconMail size={18} stroke={1.5} className="shrink-0 text-muted" />}
    />
  );
}
