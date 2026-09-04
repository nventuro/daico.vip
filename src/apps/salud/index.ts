import { lazy } from 'react';
import { IconHeart } from '@tabler/icons-react';
import { CHECKUPS_SPEC, HEALTH_RECORDS_SPEC } from '../../lib/offline/specs';
import type { AppModule } from '../types';
import { useSaludUpcoming } from './useSaludUpcoming';
import { searchSalud } from './search';

const SaludPage = lazy(() => import('./SaludPage'));
const SaludEntryPage = lazy(() => import('./SaludEntryPage'));

const salud: AppModule = {
  id: 'salud',
  name: 'Salud',
  icon: IconHeart,
  specs: [CHECKUPS_SPEC, HEALTH_RECORDS_SPEC],
  routes: [
    { index: true, Component: SaludPage },
    // The optional segment is one of a study's pictures, open in the lightbox.
    { path: ':id/:attachmentId?', Component: SaludEntryPage },
  ],
  useUpcoming: useSaludUpcoming,
  search: searchSalud,
};

export default salud;
