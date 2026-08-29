import { useEffect, useState } from 'react';
import { GUIDES_SPEC, GUIDE_CHAPTERS_SPEC, type GuideChapter } from '../../lib/offline/specs';
import * as engine from '../../lib/offline/engine';
import { useOfflineTable } from '../../hooks/useOfflineTable';

/**
 * The library of imported guides and their chapters, read from the local store
 * so it works offline. Read-only: nothing here mutates.
 *
 * The guides table brings the sync lifecycle — one run covers every table —
 * and the chapters are read alongside it, following their own table's changes
 * so a run that brings chapters down is enough to show them.
 */
export function useGuides() {
  const { items: guides, loading, error } = useOfflineTable(GUIDES_SPEC);
  const [chapters, setChapters] = useState<GuideChapter[]>([]);

  useEffect(() => {
    let active = true;
    const read = () =>
      engine
        .listVisible(GUIDE_CHAPTERS_SPEC)
        .then((rows) => {
          if (active) setChapters(rows);
        })
        .catch(() => {
          // The guides table shares the store; its error already surfaces.
        });
    void read();
    const stop = engine.subscribe(GUIDE_CHAPTERS_SPEC.table, () => void read());
    return () => {
      active = false;
      stop();
    };
  }, []);

  return { guides, chapters, loading, error };
}
