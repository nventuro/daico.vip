import { SEARCH_EXCERPT_RADIUS, excerpt, matches } from '../../lib/search';
import {
  GUIDES_SPEC,
  GUIDE_CHAPTERS_SPEC,
  type Guide,
  type GuideChapter,
} from '../../lib/offline/specs';
import * as engine from '../../lib/offline/engine';
import { entryPath, type SearchHit } from '../types';

/**
 * Guides whose title mentions `query`, then chapters that mention it in their
 * title (shown under their guide's name) or body (shown with the matching
 * passage). An archived guide is out of the way, so neither it nor its
 * chapters are found — like a chapter whose guide is not in the store, they
 * are left out.
 */
export async function searchGuides(query: string): Promise<SearchHit[]> {
  const [guides, chapters] = await Promise.all([
    engine.listVisible<Guide>(GUIDES_SPEC),
    engine.listVisible<GuideChapter>(GUIDE_CHAPTERS_SPEC),
  ]);
  const shelved = guides.filter((guide) => !guide.archived);
  const guideTitles = new Map(shelved.map((guide) => [guide.id, guide.title]));

  const guideHits = shelved.flatMap((guide): SearchHit[] =>
    matches(guide.title, query) ? [{ title: guide.title, to: entryPath('guias', guide.id) }] : [],
  );
  const chapterHits = chapters.flatMap((chapter): SearchHit[] => {
    const guideTitle = guideTitles.get(chapter.guide_id);
    if (guideTitle === undefined) return [];
    const to = entryPath('guias', chapter.guide_id, chapter.id);
    if (matches(chapter.title, query)) return [{ title: chapter.title, subtitle: guideTitle, to }];
    if (matches(chapter.body, query)) {
      return [
        { title: chapter.title, subtitle: excerpt(chapter.body, query, SEARCH_EXCERPT_RADIUS), to },
      ];
    }
    return [];
  });
  return [...guideHits, ...chapterHits];
}
