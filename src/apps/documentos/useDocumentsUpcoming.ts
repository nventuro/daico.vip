import { useMemo } from 'react';
import { todayIso } from '../../utils/dateUtils';
import { entryPath, upcomingFrom, type Upcoming } from '../types';
import { useDocuments } from './useDocuments';
import { isExpiring } from './expiry';

/** The documents expiring within six months, or already expired, for the
 *  home screen. */
export function useDocumentsUpcoming(): Upcoming[] | undefined {
  const { items, loading } = useDocuments();
  const today = todayIso();
  return useMemo(
    () =>
      upcomingFrom({ items, loading }, (entry) => {
        const on = entry.expires_on;
        return on !== null && isExpiring(entry, today)
          ? { title: entry.title, on, to: entryPath('documentos', entry.id), appId: 'documentos' }
          : null;
      }),
    [items, loading, today],
  );
}
