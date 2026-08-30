import { useLocation } from 'react-router-dom';
import { IconArrowLeft, type TablerIcon } from '@tabler/icons-react';
import IconButton from '../components/IconButton';
import Motif from '../components/Motif';
import { parentPath } from './parentPath';

/** The band at the top of an app's screens: full-bleed in the app's colour,
 *  with the way back and the app's icon and name. */
export default function AppHeader({ name, icon: Icon }: { name: string; icon?: TablerIcon }) {
  const { pathname } = useLocation();

  return (
    <div className="sticky top-(--header-height) z-20 -mx-4 mb-4 flex h-14 items-center gap-2.5 overflow-hidden bg-(--app) px-3 text-on-primary">
      <Motif band />
      <IconButton
        label="Volver"
        icon={IconArrowLeft}
        size={22}
        to={parentPath(pathname)}
        tone="band"
        className="relative p-1"
      />
      {Icon && <Icon size={24} stroke={1.75} className="relative" />}
      <span className="relative font-display text-2xl font-black tracking-tight">{name}</span>
    </div>
  );
}
