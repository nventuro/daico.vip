import type { ReactNode } from 'react';
import type { TablerIcon } from '@tabler/icons-react';

interface GateProps {
  icon: TablerIcon;
  title: string;
  text: string;
  children?: ReactNode;
}

/** A screen that stands between the member and the app: an icon, a title, a
 *  line saying why, and whatever it takes to get past it. */
export default function Gate({ icon: Icon, title, text, children }: GateProps) {
  return (
    <div className="flex min-h-dvh items-center justify-center bg-surface px-4 text-on-surface">
      <div className="flex w-full max-w-sm flex-col items-center text-center">
        <div className="mb-5 flex h-14 w-14 items-center justify-center border border-border bg-surface-raised text-muted">
          <Icon size={28} stroke={1.5} />
        </div>
        <h2 className="mb-2 font-display text-2xl font-black tracking-tight">{title}</h2>
        <p className="text-muted">{text}</p>
        {children}
      </div>
    </div>
  );
}
