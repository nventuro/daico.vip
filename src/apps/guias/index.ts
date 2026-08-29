import { lazy } from 'react';
import { IconBook } from '@tabler/icons-react';
import { GUIDES_SPEC, GUIDE_CHAPTERS_SPEC } from '../../lib/offline/specs';
import type { AppModule } from '../types';
import { searchGuides } from './search';

const GuidesPage = lazy(() => import('./GuidesPage'));
const GuidePage = lazy(() => import('./GuidePage'));
const GuideChapterPage = lazy(() => import('./GuideChapterPage'));

const guias: AppModule = {
  id: 'guias',
  name: 'Guías',
  icon: IconBook,
  specs: [GUIDES_SPEC, GUIDE_CHAPTERS_SPEC],
  routes: [
    { index: true, Component: GuidesPage },
    { path: ':guideId', Component: GuidePage },
    { path: ':guideId/:chapterId', Component: GuideChapterPage },
  ],
  search: searchGuides,
};

export default guias;
