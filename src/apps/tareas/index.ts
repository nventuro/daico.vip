import { lazy } from 'react';
import { IconListCheck } from '@tabler/icons-react';
import { CHORES_SPEC } from '../../lib/offline/specs';
import type { AppModule } from '../types';
import { useChoresStatus } from './useChoresStatus';
import { useChoresUpcoming } from './useChoresUpcoming';
import { searchChores } from './search';

const ChoresPage = lazy(() => import('./ChoresPage'));
const ChoreEditPage = lazy(() => import('./ChoreEditPage'));

const tareas: AppModule = {
  id: 'tareas',
  name: 'Tareas',
  hue: 'app-tareas',
  icon: IconListCheck,
  specs: [CHORES_SPEC],
  routes: [
    { index: true, Component: ChoresPage },
    { path: ':id', Component: ChoreEditPage },
  ],
  useStatus: useChoresStatus,
  useUpcoming: useChoresUpcoming,
  search: searchChores,
};

export default tareas;
