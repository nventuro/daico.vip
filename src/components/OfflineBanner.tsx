import type { ReactNode } from 'react';
import { IconWifiOff } from '@tabler/icons-react';
import { useOnline } from '../hooks/useOnline';
import Notice from './Notice';

interface OfflineBannerProps {
  /** What it says; unless told otherwise, that edits keep and sync later. */
  children?: ReactNode;
  className?: string;
}

/** Shown while the device has no connection: on a list, to say that edits
 *  are kept here and sent once it is back; on the home screen, to say how old
 *  what it shows is. */
export default function OfflineBanner({ children, className }: OfflineBannerProps) {
  const online = useOnline();

  if (online) return null;

  return (
    <Notice icon={IconWifiOff} className={className}>
      {children ?? 'Sin conexión — se guarda acá y se sincroniza solo cuando vuelva.'}
    </Notice>
  );
}
