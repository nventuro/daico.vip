import { useCallback } from 'react';
import { HEALTH_RECORDS_SPEC } from '../../lib/offline/specs';
import { useOfflineTable } from '../../hooks/useOfflineTable';
import { useSession } from '../../hooks/useSession';
import { lowercaseTrimmed } from '../../utils/textUtils';

/** Everything the user decides about a study; the row's own columns minus the
 *  engine-managed ones and whose it is. What the study says is its pictures. */
export interface HealthRecordInput {
  title: string;
  /** yyyy-mm-dd: the day it was done. */
  on_date: string;
}

/** Local-first studies — the signed-in member's, since the server hands out
 *  no others: add / edit / delete, syncing in the background. */
export function useHealthRecords() {
  const { items, loading, error, insert, update, remove } = useOfflineTable(HEALTH_RECORDS_SPEC);
  const owner = useSession()?.user.id ?? null;

  /** Creates a study of the signed-in member's, resolving the new id so the
   *  caller can open it to add its pictures; undefined for a blank title, no
   *  session, or a failed write. */
  const add = useCallback(
    (input: HealthRecordInput): Promise<string | undefined> => {
      const title = lowercaseTrimmed(input.title);
      if (!title || owner === null) return Promise.resolve(undefined);
      return insert({ ...input, title, owner });
    },
    [insert, owner],
  );

  const save = useCallback(
    (id: string, patch: Partial<HealthRecordInput>) => update(id, patch),
    [update],
  );

  return { items, loading, error, add, save, remove };
}
