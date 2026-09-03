import { lazy } from 'react';
import { IconCalendarEvent } from '@tabler/icons-react';
import { DATES_SPEC } from '../../lib/offline/specs';
import type { AppModule } from '../types';
import { useDatesUpcoming } from './useDatesUpcoming';
import { searchDates } from './search';

const DatesPage = lazy(() => import('./DatesPage'));
const DateNewPage = lazy(() => import('./DateNewPage'));
const DatePage = lazy(() => import('./DatePage'));

const fechas: AppModule = {
  id: 'fechas',
  name: 'Fechas',
  icon: IconCalendarEvent,
  specs: [DATES_SPEC],
  // Static segments outrank dynamic ones, which is what keeps `nuevo` from
  // being read as an id.
  routes: [
    { index: true, Component: DatesPage },
    { path: 'nuevo', Component: DateNewPage },
    { path: ':id', Component: DatePage },
  ],
  useUpcoming: useDatesUpcoming,
  search: searchDates,
};

export default fechas;
