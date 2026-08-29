import { lazy } from 'react';
import { IconCalendarEvent } from '@tabler/icons-react';
import { DATES_SPEC } from '../../lib/offline/specs';
import type { AppModule } from '../types';
import { useDatesUpcoming } from './useDatesUpcoming';
import { searchDates } from './search';

const DatesPage = lazy(() => import('./DatesPage'));
const DateEditPage = lazy(() => import('./DateEditPage'));

const fechas: AppModule = {
  id: 'fechas',
  name: 'Fechas',
  icon: IconCalendarEvent,
  specs: [DATES_SPEC],
  routes: [
    { index: true, Component: DatesPage },
    { path: ':id', Component: DateEditPage },
  ],
  useUpcoming: useDatesUpcoming,
  search: searchDates,
};

export default fechas;
