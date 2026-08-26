import { lazy } from 'react';
import { useRoutes, type RouteObject } from 'react-router-dom';
import App from '../App';
import { apps } from '../apps/registry';
import AppFrame from './AppFrame';
import HomePage from './HomePage';

const SearchPage = lazy(() => import('./SearchPage'));

const routes: RouteObject[] = [
  {
    element: <App />,
    children: [
      { index: true, element: <HomePage /> },
      {
        path: 'buscar',
        element: <AppFrame name="Buscar" hue="primary" />,
        children: [{ index: true, Component: SearchPage }],
      },
      ...apps.map((app) => ({
        path: app.id,
        element: <AppFrame name={app.name} hue={app.hue} />,
        children: app.routes,
      })),
    ],
  },
];

export default function AppRouter() {
  return useRoutes(routes);
}
