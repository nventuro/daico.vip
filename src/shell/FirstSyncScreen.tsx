import { useEffect } from 'react';
import { IconCheck, IconCloudDownload } from '@tabler/icons-react';
import { apps } from '../apps/registry';
import { appHue, type AppHue, type AppModule } from '../apps/types';
import { syncAll, type SyncStatus, type TableSyncState } from '../lib/offline/sync';
import { useSyncStatus } from '../hooks/useSyncStatus';
import { useOnline } from '../hooks/useOnline';
import Button from '../components/Button';
import Gate from './Gate';
import LoadingLine from '../components/LoadingLine';
import { hueStyle } from '../components/hue';

/** Where an app stands in the run: done once every table of its own is. */
function appState(app: AppModule, tables: SyncStatus['tables']): TableSyncState {
  const states = app.specs.map((spec) => tables[spec.table] ?? 'pending');
  if (states.length > 0 && states.every((state) => state === 'done')) return 'done';
  return states.includes('pulling') ? 'pulling' : 'pending';
}

/** Where the documents' files stand, with how far along when that is counted. */
function filesState(files: SyncStatus['files']): Pick<PullRowProps, 'state' | 'share' | 'detail'> {
  if (files === null) return { state: 'pending' };
  if (files.done < files.total) {
    return {
      state: 'pulling',
      share: files.done / files.total,
      detail: `${files.done} de ${files.total}`,
    };
  }
  return { state: 'done' };
}

interface PullRowProps {
  label: string;
  state: TableSyncState;
  hue?: AppHue;
  /** How far along, 0 to 1, when that can be counted. */
  share?: number;
  detail?: string;
}

/** One thing coming down: an app's tables, or the documents' files. Its own
 *  hairline becomes the line while it is on its way. */
function PullRow({ label, state, hue, share, detail }: PullRowProps) {
  const pending = state === 'pending';
  return (
    <li
      className={`relative flex items-center gap-3 border-b border-border py-3 ${pending ? 'text-muted' : ''}`}
    >
      <span
        className={`size-3 shrink-0 ${hue ? 'bg-(--app)' : ''} ${pending ? 'opacity-45' : ''}`}
        style={hue ? hueStyle(hue) : undefined}
      />
      <span className="min-w-0 flex-1 truncate text-left">{label}</span>
      {detail && <span className="shrink-0 text-sm text-muted">{detail}</span>}
      {state === 'done' && <IconCheck size={18} stroke={2} className="shrink-0" />}
      {state === 'pulling' && (
        <LoadingLine share={share} className="absolute inset-x-0 -bottom-px" />
      )}
    </li>
  );
}

/**
 * What a device sees the first time, while everything the household has comes
 * down: each app as its tables are pulled, then the documents' files. Stays up
 * until a run has gone through whole, unless the member goes in meanwhile.
 */
export default function FirstSyncScreen({ onEnter }: { onEnter: () => void }) {
  const { tables, files } = useSyncStatus();
  const online = useOnline();

  // No table's hook is mounted here to ask for a run, so this screen does.
  useEffect(() => {
    void syncAll();
  }, []);

  return (
    <Gate
      icon={IconCloudDownload}
      title="Preparando este dispositivo"
      text="Se baja todo lo de la casa una sola vez; después anda sin conexión."
    >
      <ul className="mt-7 w-full">
        {apps.map((app) => (
          <PullRow
            key={app.id}
            label={app.name}
            hue={appHue(app.id)}
            state={appState(app, tables)}
          />
        ))}
        <PullRow label="Archivos de los documentos" {...filesState(files)} />
      </ul>
      {!online && <p className="mt-4 text-sm text-muted">Sin conexión: sigue cuando vuelva.</p>}
      <Button variant="link" className="mt-6" onClick={onEnter}>
        Entrar mientras tanto
      </Button>
    </Gate>
  );
}
