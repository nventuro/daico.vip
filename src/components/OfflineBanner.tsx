import type { ReactNode } from 'react';
import { IconWifiOff } from '@tabler/icons-react';
import { useOnline } from '../hooks/useOnline';

interface OfflineBannerProps {
  /** What it says; unless told otherwise, that edits keep and sync later. */
  children?: ReactNode;
  className?: string;
}

/** Shown while the device has no connection: on the offline-first pages, to
 *  explain that edits are saved locally and synced when it comes back; on the
 *  home screen, to say how old what it shows is. */
export default function OfflineBanner({ children, className = 'mb-4' }: OfflineBannerProps) {
  const online = useOnline();

  if (online) return null;

  return (
    <div
      className={`flex items-center gap-2 border border-border bg-surface-raised px-3 py-2 text-sm text-muted-strong ${className}`}
    >
      <IconWifiOff size={18} stroke={1.5} className="shrink-0 text-warning" />
      <span>{children ?? 'Sin conexión — se guarda acá y se sincroniza solo cuando vuelva.'}</span>
    </div>
  );
}
