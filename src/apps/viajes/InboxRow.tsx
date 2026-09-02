import { IconMail } from '@tabler/icons-react';
import LinkRow from '../../components/LinkRow';
import { entryPath } from '../types';
import type { InboxGroup } from './grouping';
import { inboxSubtitle } from './labels';

interface InboxRowProps {
  group: InboxGroup;
  today: string;
}

/** One email's suggestions in the list: named after the trip the model saw
 *  in it, opening the review of everything it brought. */
export default function InboxRow({ group, today }: InboxRowProps) {
  return (
    <LinkRow
      to={entryPath('viajes', 'inbox', group.importId)}
      title={group.tripTitle}
      subtitle={inboxSubtitle(group.items.length, group.receivedAt, today)}
      leading={<IconMail size={18} stroke={1.5} className="shrink-0 text-muted" />}
    />
  );
}
