import { MEMBERS_SPEC } from '../lib/offline/specs';
import { useOfflineTable } from './useOfflineTable';

/** The household as this device knows it: the people and the pets, by name.
 *  Written by nobody here: the table is edited by hand and only ever read. */
export function useMembers() {
  const { items, loading } = useOfflineTable(MEMBERS_SPEC);
  return { items, loading };
}
