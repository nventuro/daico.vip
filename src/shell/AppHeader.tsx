import { Link, useLocation } from 'react-router-dom';
import { IconArrowLeft } from '@tabler/icons-react';
import { parentPath } from './parentPath';

export default function AppHeader({ name }: { name: string }) {
  const { pathname } = useLocation();

  return (
    <div className="mb-4 flex items-center gap-2">
      <Link
        to={parentPath(pathname)}
        aria-label="Volver"
        title="Volver"
        className="-ml-1 rounded-lg p-1 text-muted hover:bg-border-subtle hover:text-muted-strong"
      >
        <IconArrowLeft size={22} stroke={1.5} />
      </Link>
      <span className="font-display text-2xl font-bold tracking-tight text-(--app)">{name}</span>
    </div>
  );
}
