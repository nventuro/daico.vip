import { IconWifiOff } from '@tabler/icons-react';
import { useOnline } from '../hooks/useOnline';

/** Shown on the offline-first pages while the device has no connection, to
 *  explain that edits are saved locally and synced when it comes back. */
export default function OfflineBanner() {
  const online = useOnline();

  if (online) return null;

  return (
    <div className="mb-4 flex items-center gap-2 rounded-xl border border-border bg-surface-raised px-3 py-2 text-sm text-muted-strong">
      <IconWifiOff size={18} stroke={1.5} className="shrink-0 text-warning" />
      Sin conexión — se guarda acá y se sincroniza solo cuando vuelva.
    </div>
  );
}
