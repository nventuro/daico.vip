import { useCallback } from 'react';
import { HEALTH_RECORDS_SPEC } from '../../lib/offline/specs';
import { useOfflineTable } from '../../hooks/useOfflineTable';
import { lowercaseTrimmed } from '../../utils/textUtils';

/** Everything the user decides about a study; the row's own columns minus the
 *  engine-managed ones and whose it is. What the study says is its files. */
export interface HealthRecordInput {
  title: string;
  /** yyyy-mm-dd: the day it was done. */
  on_date: string;
}

/** Local-first studies — the signed-in member's and the pets', since the
 *  server hands out no others: add / edit / delete, syncing in the
 *  background. */
export function useHealthRecords() {
  const { items, loading, error, insert, update, remove } = useOfflineTable(HEALTH_RECORDS_SPEC);

  /** Creates a study of the member being viewed, resolving the new id so the
   *  caller can open it to add its files; undefined for a blank title or a
   *  failed write. */
  const add = useCallback(
    (input: HealthRecordInput, memberId: string): Promise<string | undefined> => {
      const title = lowercaseTrimmed(input.title);
      if (!title) return Promise.resolve(undefined);
      return insert({ ...input, title, member_id: memberId });
    },
    [insert],
  );

  const save = useCallback(
    (id: string, patch: Partial<HealthRecordInput>) => update(id, patch),
    [update],
  );

  return { items, loading, error, add, save, remove };
}
