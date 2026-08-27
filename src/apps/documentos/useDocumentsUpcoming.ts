import { useMemo } from 'react';
import type { Upcoming } from '../types';
import { todayIso } from '../../utils/dateUtils';
import { useDocuments } from './useDocuments';
import { isExpiring } from './expiry';

/** The documents whose expiry is inside their notice window, or already past,
 *  for the home screen. */
export function useDocumentsUpcoming(): Upcoming[] {
  const { items } = useDocuments();
  const today = todayIso();
  return useMemo(
    () =>
      items.flatMap((entry): Upcoming[] => {
        const on = entry.expires_on;
        return on !== null && isExpiring(entry, today)
          ? [{ title: entry.title, on, to: `/documentos/${entry.id}`, appId: 'documentos' }]
          : [];
      }),
    [items, today],
  );
}
