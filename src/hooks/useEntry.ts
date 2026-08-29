import { useParams } from 'react-router-dom';

/**
 * The entry the URL names, out of what a table hook has read; undefined while
 * the store is still being read, or for an id that is not there. `param` is the
 * route segment holding the id, for a screen that names more than one entry.
 */
export function useEntry<Row extends { id: string }>(
  rows: Row[],
  param: string = 'id',
): Row | undefined {
  const params = useParams();
  return rows.find((row) => row.id === params[param]);
}
