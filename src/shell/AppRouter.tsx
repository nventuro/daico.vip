import { lazy } from 'react';
import { useRoutes, type RouteObject } from 'react-router-dom';
import App from '../App';
import { apps } from '../apps/registry';
import { appHue } from '../apps/types';
import AppFrame from './AppFrame';
import HomePage from './HomePage';
import NotFound from './NotFound';

const SearchPage = lazy(() => import('./SearchPage'));
const ProximoPage = lazy(() => import('./ProximoPage'));

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
      {
        path: 'proximo',
        element: <AppFrame name="Próximo" hue="primary" />,
        children: [{ index: true, Component: ProximoPage }],
      },
      ...apps.map((app) => ({
        path: app.id,
        element: <AppFrame name={app.name} hue={appHue(app.id)} icon={app.icon} />,
        children: app.routes,
      })),
      { path: '*', element: <NotFound /> },
    ],
  },
];

export default function AppRouter() {
  return useRoutes(routes);
}
