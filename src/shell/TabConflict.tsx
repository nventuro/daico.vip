import { IconAppWindow } from '@tabler/icons-react';
import Button from '../components/Button';
import Gate from './Gate';

/**
 * Shown when another tab already holds the local database. The offline store
 * allows a single connection per browser, so this tab can't use it; the user
 * continues in the tab that's already open, or reloads here after closing it.
 */
export default function TabConflict() {
  return (
    <Gate
      icon={IconAppWindow}
      title="Ya está abierto en otra pestaña"
      text="Daico ya está abierto en otra pestaña o ventana. Seguí ahí, o cerrala y recargá acá."
    >
      <Button variant="link" className="mt-8" onClick={() => window.location.reload()}>
        Recargar
      </Button>
    </Gate>
  );
}
