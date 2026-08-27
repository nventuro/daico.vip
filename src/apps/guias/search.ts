import {
  SEARCH_EXCERPT_RADIUS,
  SEARCH_MAX_HITS_PER_APP,
  type Guide,
  type GuideChapter,
} from '../../types';
import * as engine from '../../lib/offline/engine';
import { GUIDES_SPEC, GUIDE_CHAPTERS_SPEC } from '../../lib/offline/specs';
import { excerpt, matches } from '../../lib/search';
import type { SearchHit } from '../types';

/**
 * Guides whose title mentions `query`, then chapters that mention it in their
 * title (shown under their guide's name) or body (shown with the matching
 * passage). A chapter whose guide is not in the store is left out.
 */
export async function searchGuides(query: string): Promise<SearchHit[]> {
  const [guides, chapters] = await Promise.all([
    engine.listVisible<Guide>(GUIDES_SPEC),
    engine.listVisible<GuideChapter>(GUIDE_CHAPTERS_SPEC),
  ]);
  const guideTitles = new Map(guides.map((guide) => [guide.id, guide.title]));

  const guideHits = guides.flatMap((guide): SearchHit[] =>
    matches(guide.title, query) ? [{ title: guide.title, to: `/guias/${guide.id}` }] : [],
  );
  const chapterHits = chapters.flatMap((chapter): SearchHit[] => {
    const guideTitle = guideTitles.get(chapter.guide_id);
    if (guideTitle === undefined) return [];
    const to = `/guias/${chapter.guide_id}/${chapter.id}`;
    if (matches(chapter.title, query)) return [{ title: chapter.title, subtitle: guideTitle, to }];
    if (matches(chapter.body, query)) {
      return [
        { title: chapter.title, subtitle: excerpt(chapter.body, query, SEARCH_EXCERPT_RADIUS), to },
      ];
    }
    return [];
  });
  return [...guideHits, ...chapterHits].slice(0, SEARCH_MAX_HITS_PER_APP);
}
