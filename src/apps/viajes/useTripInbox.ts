import { useMemo } from 'react';
import { TRIP_INBOX_SPEC } from '../../lib/offline/specs';
import { useOfflineTable } from '../../hooks/useOfflineTable';
import { inboxGroups } from './grouping';

/**
 * Local-first suggestions from the email pipeline, grouped by the email they
 * came from. The rows are written by the worker; the app only confirms or
 * discards a group, and puts its rows back when a confirmation is undone.
 */
export function useTripInbox() {
  const { items, loading, error, insert, remove } = useOfflineTable(TRIP_INBOX_SPEC);
  const groups = useMemo(() => inboxGroups(items), [items]);
  return { groups, loading, error, insert, remove };
}
