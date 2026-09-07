import { describe, it, expect } from 'vitest';
import type { BackupRun } from '../lib/offline/specs';
import { backupTrouble, latestRun, latestRunWhere } from './backups';

const run = (finished_at: string, ok = true): BackupRun => ({
  id: finished_at,
  created_at: finished_at,
  updated_at: finished_at,
  started_at: finished_at,
  finished_at,
  ok,
  stage: ok ? '' : 'objects',
  rows_read: 1,
  objects_copied: 0,
  objects_total: 0,
  bytes_sent: 0,
});

describe('the backup runs a device knows of', () => {
  it('say nothing until the device has synced whole', () => {
    expect(backupTrouble([], null)).toBe(false);
    expect(backupTrouble([run('2026-09-01T06:00:00Z', false)], null)).toBe(false);
  });

  it('say nothing while the device is still reading them', () => {
    expect(backupTrouble(null, '2026-09-07T10:00:00Z')).toBe(false);
  });

  it('are trouble when there is none', () => {
    expect(backupTrouble([], '2026-09-07T10:00:00Z')).toBe(true);
  });

  it('are trouble when the last one failed, whatever came before', () => {
    const runs = [run('2026-09-06T06:00:00Z'), run('2026-09-07T06:00:00Z', false)];
    expect(backupTrouble(runs, '2026-09-07T10:00:00Z')).toBe(true);
  });

  it('are fine while the device has not synced past the grace since the last', () => {
    const runs = [run('2026-09-05T06:00:00Z')];
    expect(backupTrouble(runs, '2026-09-07T05:00:00Z')).toBe(false);
    expect(backupTrouble(runs, '2026-09-07T07:00:00Z')).toBe(true);
  });

  it('pick the run that ended last, whatever order they came in', () => {
    const runs = [
      run('2026-09-06T06:00:00Z'),
      run('2026-09-07T06:00:00Z', false),
      run('2026-09-05T06:00:00Z'),
    ];
    expect(latestRun(runs)?.finished_at).toBe('2026-09-07T06:00:00Z');
    expect(latestRunWhere(runs, true)?.finished_at).toBe('2026-09-06T06:00:00Z');
    expect(latestRunWhere(runs, false)?.finished_at).toBe('2026-09-07T06:00:00Z');
    expect(latestRunWhere([], false)).toBeNull();
  });
});
