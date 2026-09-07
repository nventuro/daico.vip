import { BACKUP_RUNS_SPEC } from '../lib/offline/specs';
import { useOfflineTable } from './useOfflineTable';

/** The backup runs this device knows of, newest first. Written by nobody
 *  here: the table is the nightly job's to write and the app's to read. */
export function useBackupRuns() {
  const { items, loading } = useOfflineTable(BACKUP_RUNS_SPEC);
  return { runs: items, loading };
}
