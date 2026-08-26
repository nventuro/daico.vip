import { apps } from '../apps/registry';
import AppTile from './AppTile';

export default function HomePage() {
  return (
    <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3">
      {apps.map((app) => (
        <li key={app.id}>
          <AppTile app={app} />
        </li>
      ))}
    </ul>
  );
}
