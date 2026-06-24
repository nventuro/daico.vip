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
 * signal is back). Feature hooks layer typed actions on top of `mutate`.
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

  // Every mutation writes locally first (instant), then nudges a sync.
  const mutate = useCallback(
    async (op: () => Promise<unknown>) => {
      try {
        await op();
      } catch (e) {
        setError(errMessage(e));
      }
      await reload();
      syncAndReload();
    },
    [reload, syncAndReload],
  );

  return { items, loading, error, mutate };
}
