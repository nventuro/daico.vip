import { lazy } from 'react';
import { IconPlane } from '@tabler/icons-react';
import { TRIPS_SPEC, TRIP_ITEMS_SPEC, TRIP_INBOX_SPEC } from '../../lib/offline/specs';
import type { AppModule } from '../types';
import { useTripsUpcoming } from './useTripsUpcoming';
import { searchTrips } from './search';

const TripsPage = lazy(() => import('./TripsPage'));
const TripNewPage = lazy(() => import('./TripNewPage'));
const InboxReviewPage = lazy(() => import('./InboxReviewPage'));
const TripPage = lazy(() => import('./TripPage'));
const ItemNewPage = lazy(() => import('./ItemNewPage'));
const ItemPage = lazy(() => import('./ItemPage'));
const EditRedirect = lazy(() => import('../../components/EditRedirect'));

const viajes: AppModule = {
  id: 'viajes',
  name: 'Viajes',
  icon: IconPlane,
  // The suggestions staged from email are the app's to confirm, so they are
  // its table too; they reach neither Próximo nor search, being suggestions
  // rather than commitments.
  specs: [TRIPS_SPEC, TRIP_ITEMS_SPEC, TRIP_INBOX_SPEC],
  // A trip is the screen; its rows hang under it. Static segments outrank
  // dynamic ones, which is what keeps `nuevo`, `editar` and `inbox` from
  // being read as ids — both a trip's and a row's are uuids, so neither can
  // look like one.
  routes: [
    { index: true, Component: TripsPage },
    { path: 'nuevo', Component: TripNewPage },
    // One email's suggestions, reviewed as a group.
    { path: 'inbox/:importId', Component: InboxReviewPage },
    { path: ':tripId', Component: TripPage },
    // A trip is written on its own page; the address it used to be edited at
    // still leads to it.
    { path: ':tripId/editar', Component: EditRedirect },
    { path: ':tripId/nuevo', Component: ItemNewPage },
    // The optional segment is one of the row's pictures, open in the lightbox.
    { path: ':tripId/:itemId/:attachmentId?', Component: ItemPage },
  ],
  useUpcoming: useTripsUpcoming,
  search: searchTrips,
};

export default viajes;
