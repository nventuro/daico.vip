import { lazy } from 'react';
import { IconBulb } from '@tabler/icons-react';
import { IDEAS_SPEC } from '../../lib/offline/specs';
import type { AppModule } from '../types';
import { searchIdeas } from './search';

const IdeasPage = lazy(() => import('./IdeasPage'));
const IdeaPage = lazy(() => import('./IdeaPage'));
const EditRedirect = lazy(() => import('../../components/EditRedirect'));

// No `useUpcoming`: an idea has no date, so there is nothing of it that is
// coming up.
const ideas: AppModule = {
  id: 'ideas',
  name: 'Ideas',
  icon: IconBulb,
  specs: [IDEAS_SPEC],
  routes: [
    { index: true, Component: IdeasPage },
    // An idea is written on its own page; the address it used to be edited
    // at still leads to it.
    { path: ':id/editar', Component: EditRedirect },
    // The optional segment is one of the idea's attachments, open in the lightbox.
    { path: ':id/:attachmentId?', Component: IdeaPage },
  ],
  search: searchIdeas,
};

export default ideas;
