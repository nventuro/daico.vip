import type { MouseEvent } from 'react';
import { useLocation } from 'react-router-dom';
import { IconArrowLeft, type TablerIcon } from '@tabler/icons-react';
import IconButton from '../components/IconButton';
import Motif from '../components/Motif';
import { useLeave } from '../hooks/useLeave';
import { parentPath } from './parentPath';

/** A tap meant for this page: the main button, no modifier. Anything else
 *  (a middle click, ctrl-click) is the browser's to open a new tab with. */
function plainClick(e: MouseEvent<HTMLElement>): boolean {
  return e.button === 0 && !e.metaKey && !e.ctrlKey && !e.shiftKey && !e.altKey;
}

/** The band at the top of an app's screens: full-bleed in the app's colour,
 *  with the way back and the app's icon and name. */
export default function AppHeader({ name, icon: Icon }: { name: string; icon?: TablerIcon }) {
  const { pathname } = useLocation();
  const leave = useLeave();
  const parent = parentPath(pathname);

  return (
    <div className="sticky top-(--header-height) z-20 -mx-4 mb-4 flex h-14 items-center gap-2.5 overflow-hidden bg-(--app) px-3 text-on-primary">
      <Motif band />
      <IconButton
        label="Volver"
        icon={IconArrowLeft}
        size={22}
        to={parent}
        // The arrow steps back to the screen above when it is behind, rather
        // than stacking it on: the link's href is where it leads either way.
        onClick={(e) => {
          if (!plainClick(e)) return;
          e.preventDefault();
          leave(parent);
        }}
        tone="band"
        className="relative p-1"
      />
      {Icon && <Icon size={24} stroke={1.75} className="relative" />}
      <span className="relative font-display text-2xl font-black tracking-tight">{name}</span>
    </div>
  );
}
