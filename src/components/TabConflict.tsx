import { IconAppWindow } from '@tabler/icons-react';

/**
 * Shown when another tab already holds the local database. The offline store
 * allows a single connection per browser, so this tab can't use it; the user
 * continues in the tab that's already open, or reloads here after closing it.
 */
export default function TabConflict() {
  return (
    <div className="flex min-h-dvh items-center justify-center bg-surface px-4 text-on-surface">
      <div className="w-full max-w-sm text-center">
        <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-full bg-border-subtle text-muted">
          <IconAppWindow size={28} stroke={1.5} />
        </div>
        <h2 className="mb-2 text-xl font-semibold">Ya está abierto en otra pestaña</h2>
        <p className="mb-8 text-muted">
          Daico ya está abierto en otra pestaña o ventana. Seguí ahí, o cerrala y recargá acá.
        </p>
        <button
          onClick={() => window.location.reload()}
          className="text-muted underline transition-colors hover:text-muted-strong"
        >
          Recargar
        </button>
      </div>
    </div>
  );
}
