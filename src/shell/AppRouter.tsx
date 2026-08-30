import { lazy } from 'react';
import { useRoutes, type RouteObject } from 'react-router-dom';
import { IconSettings } from '@tabler/icons-react';
import App from '../App';
import { apps } from '../apps/registry';
import { appHue } from '../apps/types';
import AppFrame from './AppFrame';
import HomePage from './HomePage';
import NotFound from './NotFound';

const SearchPage = lazy(() => import('./SearchPage'));
const ProximoPage = lazy(() => import('./ProximoPage'));
const SettingsPage = lazy(() => import('./SettingsPage'));

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
        element: <AppFrame name="Próximo" hue="proximo" />,
        children: [{ index: true, Component: ProximoPage }],
      },
      {
        path: 'ajustes',
        element: <AppFrame name="Ajustes" hue="primary" icon={IconSettings} />,
        children: [{ index: true, Component: SettingsPage }],
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
