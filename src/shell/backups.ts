import type { BackupRun, BackupStage } from '../lib/offline/specs';

/** How long a device waits for a newer run before the last one counts as
 *  old: the nightly job may miss a night, and it is the second that says
 *  something is wrong. */
export const BACKUP_STALE_DAYS = 2;

const MS_PER_DAY = 86_400_000;

/** The stage a failed run stopped at, as the line in Ajustes names it. */
export const STAGE_WORDS: Record<BackupStage, string> = {
  '': '',
  tables: 'las tablas',
  guides: 'las guías',
  upload: 'la subida',
  objects: 'los archivos',
};

/** The run that ended last, or null when the device knows of none. */
export function latestRun(runs: readonly BackupRun[]): BackupRun | null {
  let latest: BackupRun | null = null;
  for (const run of runs) {
    if (latest === null || run.finished_at > latest.finished_at) latest = run;
  }
  return latest;
}

/** The run that ended last among the ones that went the way `ok` says. */
export function latestRunWhere(runs: readonly BackupRun[], ok: boolean): BackupRun | null {
  return latestRun(runs.filter((run) => run.ok === ok));
}

/**
 * Whether the copies need looking at, from what this device holds: the run
 * it knows of last failed, or the device has synced since that run by more
 * than the grace and no newer one came down. A device that has never synced
 * whole cannot tell, and says nothing; nor does one still reading the runs
 * it holds (`runs` null), which would otherwise take an unread table for an
 * empty one.
 */
export function backupTrouble(runs: readonly BackupRun[] | null, syncedAt: string | null): boolean {
  if (runs === null || syncedAt === null) return false;
  const latest = latestRun(runs);
  if (latest === null) return true;
  if (!latest.ok) return true;
  return Date.parse(syncedAt) - Date.parse(latest.finished_at) > BACKUP_STALE_DAYS * MS_PER_DAY;
}
