import { apps } from '../apps/registry';
import AppTile from './AppTile';
import UpcomingStrip from './UpcomingStrip';

export default function HomePage() {
  return (
    <>
      <UpcomingStrip />
      <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        {apps.map((app) => (
          <li key={app.id}>
            <AppTile app={app} />
          </li>
        ))}
      </ul>
    </>
  );
}
