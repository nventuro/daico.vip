import { useMemo } from 'react';
import { ownersWithAttachments, useAttachments } from '../../hooks/useAttachments';
import { useToday } from '../../hooks/useToday';
import { entryPath, upcomingFrom, type Upcoming } from '../types';
import { pantryMarks } from './marks';
import { isExpiring } from './pantry';
import { usePantry } from './usePantry';

/** The items expiring within two weeks, or already gone off, for the home
 *  screen. */
export function usePantryUpcoming(): Upcoming[] | undefined {
  const { items, loading } = usePantry();
  const { items: attachments } = useAttachments();
  const today = useToday();
  return useMemo(() => {
    const attached = ownersWithAttachments(attachments, 'pantry_item');
    return upcomingFrom({ items, loading }, (item) =>
      item.expires_on !== null && isExpiring(item, today)
        ? {
            title: item.title,
            on: item.expires_on,
            to: entryPath('despensa', item.id),
            appId: 'despensa',
            marks: pantryMarks(item, attached.has(item.id)),
          }
        : null,
    );
  }, [items, loading, attachments, today]);
}
