import { useSyncExternalStore } from 'react';
import { getSyncStatus, subscribeSyncStatus, type SyncStatus } from '../lib/offline/sync';

const whole = (status: SyncStatus) => status;

/**
 * The sync status, kept current as runs start, advance and end — or, given
 * `select`, one thing read off it, so a screen that only draws whether a run
 * is on is not redrawn for every table the run gets through. What `select`
 * returns must be the same value while nothing has changed: a primitive, or a
 * part of the status as it is.
 */
export function useSyncStatus(): SyncStatus;
export function useSyncStatus<T>(select: (status: SyncStatus) => T): T;
export function useSyncStatus<T>(select: (status: SyncStatus) => T | SyncStatus = whole) {
  const snapshot = () => select(getSyncStatus());
  return useSyncExternalStore(subscribeSyncStatus, snapshot, snapshot);
}
