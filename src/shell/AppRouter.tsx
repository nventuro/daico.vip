import { useRoutes, type RouteObject } from 'react-router-dom';
import App from '../App';
import { apps } from '../apps/registry';
import AppFrame from './AppFrame';
import HomePage from './HomePage';

const routes: RouteObject[] = [
  {
    element: <App />,
    children: [
      { index: true, element: <HomePage /> },
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
