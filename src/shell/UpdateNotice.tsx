import { IconCloudDownload } from '@tabler/icons-react';
import Notice from '../components/Notice';
import Button from '../components/Button';
import { useUpdateWaiting } from '../hooks/useUpdateWaiting';
import { applyUpdate } from '../lib/appUpdate';

/** Shown while a version newer than the running one is downloaded and waiting.
 *  It goes in on its own the moment the app leaves the screen, so this is for
 *  the member who never puts it down — and for saying that it is there at all. */
export default function UpdateNotice({ className }: { className?: string }) {
  const waiting = useUpdateWaiting();

  if (!waiting) return null;

  return (
    <Notice icon={IconCloudDownload} iconClassName="text-on-surface" className={className}>
      <p>Hay una versión nueva, ya bajada.</p>
      <p className="mt-0.5 text-muted">Entra sola cuando salgas de la app.</p>
      <Button variant="link" className="mt-1.5" onClick={applyUpdate}>
        Actualizar ahora
      </Button>
    </Notice>
  );
}
