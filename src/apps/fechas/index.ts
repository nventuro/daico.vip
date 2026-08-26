import { lazy } from 'react';
import { IconCalendarEvent } from '@tabler/icons-react';
import { DATES_SPEC } from '../../lib/offline/specs';
import type { AppModule } from '../types';
import { useDatesStatus } from './useDatesStatus';
import { useDatesUpcoming } from './useDatesUpcoming';

const DatesPage = lazy(() => import('./DatesPage'));
const DateEditPage = lazy(() => import('./DateEditPage'));

const fechas: AppModule = {
  id: 'fechas',
  name: 'Fechas',
  hue: 'app-fechas',
  icon: IconCalendarEvent,
  specs: [DATES_SPEC],
  routes: [
    { index: true, Component: DatesPage },
    { path: ':id', Component: DateEditPage },
  ],
  useStatus: useDatesStatus,
  useUpcoming: useDatesUpcoming,
};

export default fechas;
