import { lazy } from 'react';
import { IconChefHat } from '@tabler/icons-react';
import { RECIPES_SPEC } from '../../lib/offline/specs';
import type { AppModule } from '../types';
import { useRecipesStatus } from './useRecipesStatus';
import { searchRecipes } from './search';

const RecipesPage = lazy(() => import('./RecipesPage'));
const RecipePage = lazy(() => import('./RecipePage'));
const RecipeEditPage = lazy(() => import('./RecipeEditPage'));

const recetas: AppModule = {
  id: 'recetas',
  name: 'Recetas',
  hue: 'app-recetas',
  icon: IconChefHat,
  specs: [RECIPES_SPEC],
  routes: [
    { index: true, Component: RecipesPage },
    { path: ':id', Component: RecipePage },
    { path: ':id/editar', Component: RecipeEditPage },
  ],
  useStatus: useRecipesStatus,
  search: searchRecipes,
};

export default recetas;
