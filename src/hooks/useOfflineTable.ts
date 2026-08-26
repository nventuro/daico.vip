import { useState, useEffect, useCallback } from 'react';
import type { TableSpec } from '../lib/offline/specs';
import * as engine from '../lib/offline/engine';
import { syncAll } from '../lib/offline/sync';

function errMessage(e: unknown): string {
  return e instanceof Error ? e.message : String(e);
}

/**
 * Lifecycle for a local-first table: the local SQLite store is the source of
 * truth (so every action is instant and works offline) and a background sync
 * reconciles with the server whenever possible. Re-syncs on regaining
 * connection and when the app returns to the foreground (you reopen it once
 * signal is back). `items` follows the store's change events, so it reflects
 * writes and sync merges made by any other instance too. Feature hooks layer
 * typed actions on top of `mutate`.
 */
export function useOfflineTable<T extends { id: string }>(spec: TableSpec) {
  const [items, setItems] = useState<T[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(async () => {
    try {
      setItems(await engine.listVisible<T>(spec));
      setError(null);
    } catch (e) {
      setError(errMessage(e));
    }
  }, [spec]);

  const syncAndReload = useCallback(async () => {
    await syncAll();
    await reload();
  }, [reload]);

  // Show local data immediately, then sync in the background.
  useEffect(() => {
    let active = true;
    (async () => {
      await reload();
      if (active) setLoading(false);
      syncAndReload();
    })();
    return () => {
      active = false;
    };
  }, [reload, syncAndReload]);

  // Follow every change to the table, whoever made it.
  useEffect(() => engine.subscribe(spec.table, () => void reload()), [spec.table, reload]);

  // Re-sync on reconnect and when the tab becomes visible again.
  useEffect(() => {
    const onOnline = () => syncAndReload();
    const onVisible = () => {
      if (document.visibilityState === 'visible') syncAndReload();
    };
    window.addEventListener('online', onOnline);
    document.addEventListener('visibilitychange', onVisible);
    return () => {
      window.removeEventListener('online', onOnline);
      document.removeEventListener('visibilitychange', onVisible);
    };
  }, [syncAndReload]);

  // Every mutation writes locally first (instant), then nudges a sync. The
  // write's change event is what refreshes `items`, on this and every other
  // instance alike.
  const mutate = useCallback(
    async <R,>(op: () => Promise<R>): Promise<R | undefined> => {
      let result: R | undefined;
      try {
        result = await op();
      } catch (e) {
        setError(errMessage(e));
      }
      syncAndReload();
      return result;
    },
    [syncAndReload],
  );

  return { items, loading, error, mutate };
}
