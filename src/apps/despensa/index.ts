import { lazy } from 'react';
import { IconPaperBag } from '@tabler/icons-react';
import { PANTRY_SPEC } from '../../lib/offline/specs';
import type { AppModule } from '../types';
import { usePantryUpcoming } from './usePantryUpcoming';
import { searchPantry } from './search';

const PantryPage = lazy(() => import('./PantryPage'));
const PantryItemPage = lazy(() => import('./PantryItemPage'));

const despensa: AppModule = {
  id: 'despensa',
  name: 'Despensa',
  icon: IconPaperBag,
  specs: [PANTRY_SPEC],
  routes: [
    { index: true, Component: PantryPage },
    // The optional segment is one of the item's attachments, open in the lightbox.
    { path: ':id/:attachmentId?', Component: PantryItemPage },
  ],
  useUpcoming: usePantryUpcoming,
  search: searchPantry,
};

export default despensa;
