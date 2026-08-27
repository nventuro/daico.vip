import { lazy } from 'react';
import { IconListCheck } from '@tabler/icons-react';
import { CHORES_SPEC } from '../../lib/offline/specs';
import type { AppModule } from '../types';
import { useChoresUpcoming } from './useChoresUpcoming';
import { searchChores } from './search';

const ChoresPage = lazy(() => import('./ChoresPage'));
const ChoreEditPage = lazy(() => import('./ChoreEditPage'));
const NewChoreAttachmentPage = lazy(() => import('./NewChoreAttachmentPage'));
const ChoreAttachmentPage = lazy(() => import('./ChoreAttachmentPage'));

const tareas: AppModule = {
  id: 'tareas',
  name: 'Tareas',
  hue: 'app-tareas',
  icon: IconListCheck,
  specs: [CHORES_SPEC],
  routes: [
    { index: true, Component: ChoresPage },
    { path: ':id', Component: ChoreEditPage },
    { path: ':id/nuevo/:attachmentId', Component: NewChoreAttachmentPage },
    { path: ':id/:attachmentId', Component: ChoreAttachmentPage },
  ],
  useUpcoming: useChoresUpcoming,
  search: searchChores,
};

export default tareas;
