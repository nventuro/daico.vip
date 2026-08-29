import { useState, useEffect, useCallback } from 'react';
import type { SyncedRow } from '../types';
import type { RowInput, TableSpec } from '../lib/offline/specs';
import * as engine from '../lib/offline/engine';
import { syncAll, syncIfStale } from '../lib/offline/sync';
import { errorMessage } from '../utils/textUtils';

/**
 * Lifecycle for a local-first table: the local SQLite store is the source of
 * truth (so every action is instant and works offline) and a background sync
 * reconciles with the server whenever possible. `items` follows the store's
 * change events, so it reflects writes and sync merges made by any other
 * instance too. Feature hooks layer their own actions on top of these.
 */
export function useOfflineTable<Row extends SyncedRow>(spec: TableSpec<Row>) {
  const [items, setItems] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(async () => {
    try {
      setItems(await engine.listVisible(spec));
    } catch (e) {
      setError(errorMessage(e));
    }
  }, [spec]);

  // Show local data immediately, then sync in the background — unless a run
  // just ended, so that moving between screens doesn't sync at every tap.
  useEffect(() => {
    let active = true;
    (async () => {
      await reload();
      if (active) setLoading(false);
      await syncIfStale();
    })();
    return () => {
      active = false;
    };
  }, [reload]);

  // Follow every change to the table, whoever made it — this instance's own
  // writes, another instance's, or a sync merge.
  useEffect(() => engine.subscribe(spec.table, () => void reload()), [spec.table, reload]);

  // Every mutation writes locally first (instant), then nudges a sync. The
  // write's change event is what refreshes `items`, on this and every other
  // instance alike. A failed mutation stays reported until the next one: the
  // reloads that follow it must not wipe the message before it is even seen.
  const mutate = useCallback(async <R>(op: () => Promise<R>): Promise<R | undefined> => {
    setError(null);
    let result: R | undefined;
    try {
      result = await op();
    } catch (e) {
      setError(errorMessage(e));
    }
    void syncAll();
    return result;
  }, []);

  const insert = useCallback(
    (values: RowInput<Row>, id?: string) => mutate(() => engine.insert(spec, values, id)),
    [mutate, spec],
  );

  const update = useCallback(
    (id: string, patch: Partial<RowInput<Row>>) => mutate(() => engine.update(spec, id, patch)),
    [mutate, spec],
  );

  const remove = useCallback((id: string) => mutate(() => engine.remove(spec, id)), [mutate, spec]);

  return { items, loading, error, insert, update, remove, mutate };
}
