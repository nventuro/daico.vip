import { lazy } from 'react';
import { IconHeart } from '@tabler/icons-react';
import { CHECKUPS_SPEC, HEALTH_RECORDS_SPEC } from '../../lib/offline/specs';
import type { AppModule } from '../types';
import { useSaludUpcoming } from './useSaludUpcoming';
import { searchSalud } from './search';

const SaludPage = lazy(() => import('./SaludPage'));
const SaludNewPage = lazy(() => import('./SaludNewPage'));
const SaludEntryPage = lazy(() => import('./SaludEntryPage'));

const salud: AppModule = {
  id: 'salud',
  name: 'Salud',
  icon: IconHeart,
  specs: [CHECKUPS_SPEC, HEALTH_RECORDS_SPEC],
  // Static segments outrank dynamic ones, which is what keeps `nuevo` from
  // being read as an id.
  routes: [
    { index: true, Component: SaludPage },
    { path: 'nuevo', Component: SaludNewPage },
    // The optional segment is one of a study's pictures, open in the lightbox.
    { path: ':id/:attachmentId?', Component: SaludEntryPage },
  ],
  useUpcoming: useSaludUpcoming,
  search: searchSalud,
};

export default salud;
