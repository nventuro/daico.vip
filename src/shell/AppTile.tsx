import { Link } from 'react-router-dom';
import type { AppModule } from '../apps/types';
import { hueStyle } from './hue';
import TileStatus from './TileStatus';

export default function AppTile({ app }: { app: AppModule }) {
  const Icon = app.icon;

  return (
    <Link
      to={`/${app.id}`}
      style={hueStyle(app.hue)}
      className="flex aspect-square flex-col items-center justify-center gap-3 rounded-2xl bg-(--app) p-4 text-on-primary transition-opacity hover:opacity-90 active:opacity-80"
    >
      <Icon size={36} stroke={1.5} />
      <span className="flex min-w-0 max-w-full flex-col items-center text-center">
        <span className="font-display text-lg font-bold">{app.name}</span>
        {app.useStatus && <TileStatus useStatus={app.useStatus} />}
      </span>
    </Link>
  );
}
