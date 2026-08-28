import { Link, useLocation } from 'react-router-dom';
import { IconArrowLeft, type TablerIcon } from '@tabler/icons-react';
import Motif from '../components/Motif';
import { parentPath } from './parentPath';

/** The band at the top of an app's screens: full-bleed in the app's colour,
 *  with the way back and the app's icon and name. */
export default function AppHeader({ name, icon: Icon }: { name: string; icon?: TablerIcon }) {
  const { pathname } = useLocation();

  return (
    <div className="relative -mx-4 mb-4 flex h-14 items-center gap-2.5 overflow-hidden bg-(--app) px-3 text-on-primary">
      <Motif band />
      <Link
        to={parentPath(pathname)}
        aria-label="Volver"
        title="Volver"
        className="relative p-1 transition-opacity hover:opacity-80"
      >
        <IconArrowLeft size={22} stroke={1.75} />
      </Link>
      {Icon && <Icon size={24} stroke={1.75} className="relative" />}
      <span className="relative font-display text-2xl font-black tracking-tight">{name}</span>
    </div>
  );
}
