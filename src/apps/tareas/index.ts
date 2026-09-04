import { lazy } from 'react';
import { IconListCheck } from '@tabler/icons-react';
import { CHORES_SPEC } from '../../lib/offline/specs';
import type { AppModule } from '../types';
import { useChoresUpcoming } from './useChoresUpcoming';
import { searchChores } from './search';

const ChoresPage = lazy(() => import('./ChoresPage'));
const ChorePage = lazy(() => import('./ChorePage'));

const tareas: AppModule = {
  id: 'tareas',
  name: 'Tareas',
  icon: IconListCheck,
  specs: [CHORES_SPEC],
  routes: [
    { index: true, Component: ChoresPage },
    // The optional segment is one of the chore's attachments, open in the lightbox.
    { path: ':id/:attachmentId?', Component: ChorePage },
  ],
  useUpcoming: useChoresUpcoming,
  search: searchChores,
};

export default tareas;
