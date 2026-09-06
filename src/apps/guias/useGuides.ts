import { useEffect, useState } from 'react';
import { GUIDES_SPEC, GUIDE_CHAPTERS_SPEC, type GuideChapter } from '../../lib/offline/specs';
import * as engine from '../../lib/offline/engine';
import { useOfflineTable } from '../../hooks/useOfflineTable';
import { errorMessage } from '../../utils/textUtils';

/** What the household decides about a guide from its editor: its title and
 *  the group it is shelved under. Whether it is archived is flipped on its
 *  own, from the guide's page. */
export interface GuideInput {
  title: string;
  group_name: string;
}

/**
 * The library of imported guides and their chapters, read from the local store
 * so it works offline. A guide's title, group and archived flag are the
 * household's to change; everything else — the chapters above all — is only
 * ever read.
 *
 * The guides table brings the sync lifecycle — one run covers every table —
 * and the chapters are read alongside it, following their own table's changes
 * so a run that brings chapters down is enough to show them.
 */
export function useGuides() {
  const { items: guides, loading, error, update } = useOfflineTable(GUIDES_SPEC);
  // Undefined until read: a chapter page that sees an empty list would say
  // the chapter is not there for the render before it is.
  const [chapters, setChapters] = useState<GuideChapter[] | undefined>(undefined);
  const [chaptersError, setChaptersError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    const read = () =>
      engine.listVisible(GUIDE_CHAPTERS_SPEC).then(
        (rows) => {
          if (active) setChapters(rows);
        },
        (e: unknown) => {
          if (active) setChaptersError(errorMessage(e));
        },
      );
    void read();
    const stop = engine.subscribe(GUIDE_CHAPTERS_SPEC.table, () => void read());
    return () => {
      active = false;
      stop();
    };
  }, []);

  return {
    guides,
    chapters: chapters ?? [],
    loading: loading || chapters === undefined,
    error: error ?? chaptersError,
    save: update,
  };
}
