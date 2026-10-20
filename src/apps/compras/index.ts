import { lazy } from 'react';
import { IconShoppingCart } from '@tabler/icons-react';
import { SHOPPING_SECTIONS_SPEC, SHOPPING_SPEC } from '../../lib/offline/specs';
import type { AppModule } from '../types';
import { searchShopping } from './search';

const ShoppingPage = lazy(() => import('./ShoppingPage'));
const SectionPage = lazy(() => import('./SectionPage'));

const compras: AppModule = {
  id: 'compras',
  name: 'Compras',
  icon: IconShoppingCart,
  // The sections first, so an item comes down after the section it names.
  specs: [SHOPPING_SECTIONS_SPEC, SHOPPING_SPEC],
  // The list is the screen; a section is a page of it, for filling it.
  routes: [
    { index: true, Component: ShoppingPage },
    { path: ':id', Component: SectionPage },
  ],
  search: searchShopping,
  // No `useUpcoming`: nothing on the list has a day, and the list itself is
  // one tap from the home screen.
};

export default compras;
