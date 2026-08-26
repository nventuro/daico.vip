import { lazy } from 'react';
import { IconShoppingCart } from '@tabler/icons-react';
import { SHOPPING_SPEC } from '../../lib/offline/specs';
import type { AppModule } from '../types';
import { useShoppingStatus } from './useShoppingStatus';

const ShoppingPage = lazy(() => import('./ShoppingPage'));

const compras: AppModule = {
  id: 'compras',
  name: 'Compras',
  hue: 'app-compras',
  icon: IconShoppingCart,
  specs: [SHOPPING_SPEC],
  routes: [{ index: true, Component: ShoppingPage }],
  useStatus: useShoppingStatus,
};

export default compras;
