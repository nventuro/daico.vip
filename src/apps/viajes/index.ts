import { lazy } from 'react';
import { IconPlane } from '@tabler/icons-react';
import { TRIPS_SPEC, TRIP_ITEMS_SPEC } from '../../lib/offline/specs';
import type { AppModule } from '../types';
import { useTripsUpcoming } from './useTripsUpcoming';
import { searchTrips } from './search';

const TripsPage = lazy(() => import('./TripsPage'));
const TripNewPage = lazy(() => import('./TripNewPage'));
const TripPage = lazy(() => import('./TripPage'));
const TripEditPage = lazy(() => import('./TripEditPage'));
const ItemNewPage = lazy(() => import('./ItemNewPage'));
const ItemEditPage = lazy(() => import('./ItemEditPage'));

const viajes: AppModule = {
  id: 'viajes',
  name: 'Viajes',
  icon: IconPlane,
  specs: [TRIPS_SPEC, TRIP_ITEMS_SPEC],
  // A trip is the screen; its rows hang under it. Static segments outrank
  // dynamic ones, which is what keeps `nuevo` and `editar` from being read as
  // ids — both a trip's and a row's are uuids, so neither can look like one.
  routes: [
    { index: true, Component: TripsPage },
    { path: 'nuevo', Component: TripNewPage },
    { path: ':tripId', Component: TripPage },
    { path: ':tripId/editar', Component: TripEditPage },
    { path: ':tripId/nuevo', Component: ItemNewPage },
    // The optional segment is one of the row's pictures, open in the lightbox.
    { path: ':tripId/:itemId/:attachmentId?', Component: ItemEditPage },
  ],
  useUpcoming: useTripsUpcoming,
  search: searchTrips,
};

export default viajes;
