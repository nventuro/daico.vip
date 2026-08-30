import { useState } from 'react';
import { IconAlertTriangle, IconLogout } from '@tabler/icons-react';
import Button from '../components/Button';
import DialogFooter from '../components/DialogFooter';
import ErrorLine from '../components/ErrorLine';
import Notice from '../components/Notice';
import SectionLabel from '../components/SectionLabel';
import SkeletonRows from '../components/SkeletonRows';
import ValueRow from '../components/ValueRow';
import { useDeviceStatus, type DeviceStatus } from '../hooks/useDeviceStatus';
import { useOnline } from '../hooks/useOnline';
import { useSyncStatus } from '../hooks/useSyncStatus';
import { useUpdateWaiting } from '../hooks/useUpdateWaiting';
import { applyUpdate } from '../lib/appUpdate';
import { askToPersist, freeSpace } from '../lib/deviceStorage';
import { syncAll } from '../lib/offline/sync';
import { dayOf, relativeDayTime, todayIso } from '../utils/dateUtils';
import { formatBytes } from '../utils/textUtils';
import { useAppContext } from './appContext';
import StorageBar from './StorageBar';

function plural(count: number, one: string, many: string): string {
  return `${count} ${count === 1 ? one : many}`;
}

/** What signing out would take with it, or null when it would take nothing:
 *  the changes and the pictures this device is the only one to hold. */
function unsavedWork({ pending, files }: DeviceStatus): string | null {
  const parts = [
    pending > 0 ? plural(pending, 'cambio', 'cambios') : null,
    files.waiting > 0 ? plural(files.waiting, 'foto', 'fotos') : null,
  ].filter((part) => part !== null);
  if (parts.length === 0) return null;
  return `Hay ${parts.join(' y ')} sin subir. Este dispositivo es el único que los tiene: se pierden.`;
}

export default function SettingsPage() {
  const { status, error, reload } = useDeviceStatus();
  const { completedAt } = useSyncStatus();
  const online = useOnline();
  const updateWaiting = useUpdateWaiting();
  const { signOut } = useAppContext();
  const [confirming, setConfirming] = useState(false);
  const [busy, setBusy] = useState(false);

  async function run(work: () => Promise<unknown>): Promise<void> {
    setBusy(true);
    try {
      await work();
      await reload();
    } finally {
      setBusy(false);
    }
  }

  if (status === null) {
    return (
      <>
        <ErrorLine error={error} className="mb-4" />
        <SkeletonRows />
      </>
    );
  }

  const { pending, refusals, files, storage } = status;
  // A device that has not brought everything down today is behind enough to
  // say so: the household's day is the unit everything else here is read in.
  const stale = completedAt === null || dayOf(completedAt) !== todayIso();
  const kept = storage.database + storage.files + storage.guideImages;
  const losing = unsavedWork(status);

  return (
    <div className="flex flex-col gap-7">
      <ErrorLine error={error} />

      <section>
        <SectionLabel>Sincronización</SectionLabel>
        <ul>
          <ValueRow
            label="Última completa"
            value={completedAt === null ? 'Nunca' : relativeDayTime(todayIso(), completedAt)}
            bad={stale}
          />
          <ValueRow
            label="Cambios sin subir"
            value={pending === 0 ? 'Ninguno' : pending}
            bad={pending > 0}
          />
          {refusals.length > 0 && (
            <ValueRow
              label="Rechazados"
              value={refusals.length}
              bad
              note={`${refusals[0].table} · ${refusals[0].code}${
                refusals.length > 1 ? ` y ${refusals.length - 1} más` : ''
              }`}
            />
          )}
          <ValueRow
            label="Fotos sin subir"
            value={files.waiting === 0 ? 'Ninguna' : files.waiting}
            bad={files.waiting > 0}
            note={files.failed > 0 ? plural(files.failed, 'falló', 'fallaron') : undefined}
          />
          <ValueRow
            label="Versión"
            value={__APP_VERSION__}
            note={updateWaiting ? 'Hay una más nueva, ya bajada.' : undefined}
            action={
              updateWaiting ? (
                <Button variant="link" onClick={applyUpdate}>
                  Actualizar ahora
                </Button>
              ) : undefined
            }
          />
        </ul>
        <div className="mt-3">
          <Button variant="outline" disabled={!online || busy} onClick={() => void run(syncAll)}>
            Sincronizar ahora
          </Button>
        </div>
      </section>

      <section>
        <SectionLabel>Espacio</SectionLabel>
        {storage.persisted === false && (
          <Notice icon={IconAlertTriangle} className="mt-1 mb-3">
            El navegador no se comprometió a guardar esto: puede borrarlo si le falta lugar.
            <Button
              variant="link"
              className="mt-1.5 block"
              disabled={busy}
              onClick={() => void run(askToPersist)}
            >
              Pedirle que lo guarde
            </Button>
          </Notice>
        )}
        <StorageBar
          parts={[
            { bytes: storage.database, tone: 'strong' },
            { bytes: storage.files, tone: 'medium' },
            { bytes: storage.guideImages, tone: 'soft' },
          ]}
        />
        <ul className="mt-2">
          <ValueRow label="Base de datos" value={formatBytes(storage.database)} />
          <ValueRow
            label="Fotos"
            value={formatBytes(storage.files)}
            note={
              storage.documentFiles > 0
                ? `${formatBytes(storage.documentFiles)} son de documentos, que se descargan automáticamente.`
                : undefined
            }
          />
          <ValueRow label="Imágenes de guías" value={formatBytes(storage.guideImages)} />
        </ul>
        <p className="mt-2 text-sm text-muted">
          {formatBytes(kept)} en total.
          {storage.persisted === true && ' El navegador no lo borra solo.'}
        </p>
        <div className="mt-3">
          <Button variant="outline" disabled={busy} onClick={() => void run(freeSpace)}>
            Liberar espacio
          </Button>
        </div>
        <p className="mt-2 text-sm text-muted">
          Se eliminan las imágenes de guías y las fotos que no son de documentos. Vuelven a bajarse
          cuando hagan falta.
        </p>
      </section>

      <section>
        <SectionLabel>Sesión</SectionLabel>
        {confirming ? (
          <div className="mt-1 flex flex-col gap-2">
            <p className="font-medium text-on-surface">¿Cerrar sesión?</p>
            <p className="text-sm text-muted">
              Para volver a entrar hacen falta las palabras secretas.
              {losing !== null && (
                <>
                  <br />
                  <br />
                  {losing}
                </>
              )}
            </p>
            <DialogFooter
              onCancel={() => setConfirming(false)}
              onConfirm={signOut}
              confirmLabel="Cerrar sesión"
              confirmVariant="danger"
            />
          </div>
        ) : (
          <>
            <div className="mt-1">
              <Button
                variant="dangerOutline"
                disabled={!online}
                onClick={() => setConfirming(true)}
                className="flex items-center gap-2"
              >
                <IconLogout size={20} stroke={1.75} />
                Cerrar sesión
              </Button>
            </div>
            <p className="mt-2 text-sm text-muted">
              {online
                ? 'Para volver a entrar hacen falta las palabras secretas.'
                : 'Necesitás conexión para cerrar sesión.'}
            </p>
          </>
        )}
      </section>
    </div>
  );
}
