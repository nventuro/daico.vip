import { useEffect, useState } from 'react';
import type { Guide, GuideChapter } from '../../types';
import { GUIDES_SPEC, GUIDE_CHAPTERS_SPEC } from '../../lib/offline/specs';
import * as engine from '../../lib/offline/engine';
import { useOfflineTable } from '../../hooks/useOfflineTable';

/**
 * The library of imported guides and their chapters, read from the local store
 * so it works offline. Read-only: nothing here mutates.
 *
 * A single sync lifecycle (on the guides table) covers both tables — every
 * refresh of `guides` happens after a full sync, so chapters are re-read from
 * the local store at that point rather than running a second lifecycle that
 * would sync everything twice.
 */
export function useGuides() {
  const { items: guides, loading, error } = useOfflineTable<Guide>(GUIDES_SPEC);
  const [chapters, setChapters] = useState<GuideChapter[]>([]);

  useEffect(() => {
    let active = true;
    engine
      .listVisible<GuideChapter>(GUIDE_CHAPTERS_SPEC)
      .then((rows) => {
        if (active) setChapters(rows);
      })
      .catch(() => {
        // The guides table shares the store; its error already surfaces.
      });
    return () => {
      active = false;
    };
  }, [guides]);

  return { guides, chapters, loading, error };
}
