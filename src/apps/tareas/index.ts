import { lazy } from 'react';
import { IconListCheck } from '@tabler/icons-react';
import { CHORES_SPEC } from '../../lib/offline/specs';
import type { AppModule } from '../types';

const ChoresPage = lazy(() => import('./ChoresPage'));

const tareas: AppModule = {
  id: 'tareas',
  name: 'Tareas',
  hue: 'app-tareas',
  icon: IconListCheck,
  specs: [CHORES_SPEC],
  routes: [{ index: true, Component: ChoresPage }],
};

export default tareas;
