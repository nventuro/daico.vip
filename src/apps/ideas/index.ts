import { lazy } from 'react';
import { IconBulb } from '@tabler/icons-react';
import { IDEAS_SPEC } from '../../lib/offline/specs';
import type { AppModule } from '../types';
import { searchIdeas } from './search';

const IdeasPage = lazy(() => import('./IdeasPage'));
const IdeaNewPage = lazy(() => import('./IdeaNewPage'));
const IdeaPage = lazy(() => import('./IdeaPage'));
const IdeaEditPage = lazy(() => import('./IdeaEditPage'));

// No `useUpcoming`: an idea has no date, so there is nothing of it that is
// coming up.
const ideas: AppModule = {
  id: 'ideas',
  name: 'Ideas',
  icon: IconBulb,
  specs: [IDEAS_SPEC],
  // Static segments outrank dynamic ones, which is what keeps `nuevo` from
  // being read as an id.
  routes: [
    { index: true, Component: IdeasPage },
    { path: 'nuevo', Component: IdeaNewPage },
    { path: ':id/editar', Component: IdeaEditPage },
    // The optional segment is one of the idea's attachments, open in the lightbox.
    { path: ':id/:attachmentId?', Component: IdeaPage },
  ],
  search: searchIdeas,
};

export default ideas;
