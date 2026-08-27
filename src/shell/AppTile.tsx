import { Link } from 'react-router-dom';
import type { AppModule } from '../apps/types';
import { hueStyle } from './hue';
import Motif from './Motif';

export default function AppTile({ app }: { app: AppModule }) {
  const Icon = app.icon;

  return (
    <Link
      to={`/${app.id}`}
      style={hueStyle(app.hue)}
      className="relative flex aspect-square flex-col items-center justify-center gap-2 overflow-hidden bg-(--app) p-4 text-on-primary transition-opacity hover:opacity-90 active:opacity-80"
    >
      <Motif />
      <Icon size={36} stroke={1.75} className="relative" />
      <span className="relative max-w-full truncate font-display text-2xl font-black">
        {app.name}
      </span>
    </Link>
  );
}
