import { useBackupRuns } from '../hooks/useBackupRuns';
import { useSyncStatus } from '../hooks/useSyncStatus';
import { backupTrouble } from './backups';

const NOTICE = 'La copia de seguridad necesita atención';

/** The mark on the gear's corner when the nightly copy failed or stopped
 *  coming: Ajustes says which. Nothing is drawn while all is well. */
export default function BackupMark() {
  const { runs, loading } = useBackupRuns();
  const completedAt = useSyncStatus((status) => status.completedAt);
  if (!backupTrouble(loading ? null : runs, completedAt)) return null;
  return (
    <span
      role="status"
      aria-label={NOTICE}
      title={NOTICE}
      className="pointer-events-none absolute top-0.5 right-1 size-2 bg-warning ring-2 ring-surface"
    />
  );
}
