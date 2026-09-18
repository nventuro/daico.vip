import { useEffect } from 'react';
import { IconCheck, IconCloudDownload } from '@tabler/icons-react';
import { apps } from '../apps/registry';
import { appHue, type AppHue, type AppModule } from '../apps/types';
import { type SyncStatus, type TableSyncState } from '../lib/offline/sync';
import { useSyncStatus } from '../hooks/useSyncStatus';
import { useOnline } from '../hooks/useOnline';
import Button from '../components/Button';
import Gate from './Gate';
import LoadingLine from '../components/LoadingLine';
import { hueStyle } from '../components/hue';

/** How long a device that already holds everything gives the server to say
 *  anything at all before it takes the link for dead and lets the member in:
 *  the run goes on behind them, and the diamond by the wordmark says so. A
 *  device that has never brought the household down waits however long it
 *  takes, since what is behind this screen is empty. */
const FIRST_ANSWER_MS = 2_000;

/** Where an app stands in the run: done once every table of its own is. */
function appState(app: AppModule, tables: SyncStatus['tables']): TableSyncState {
  const states = app.specs.map((spec) => tables[spec.table] ?? 'pending');
  if (states.length > 0 && states.every((state) => state === 'done')) return 'done';
  return states.includes('pulling') ? 'pulling' : 'pending';
}

/** Where the kept files stand, with how far along when that is counted. */
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
 * What a device shows while what the household has comes down: each app as its
 * tables are pulled, then the files that are kept. It is up on every open, so
 * that what is read is what there is — the shell asks for that run and this
 * screen watches it — and the member can always go in meanwhile.
 */
export default function FirstSyncScreen({ onEnter }: { onEnter: () => void }) {
  const { tables, files, completedAt, answered } = useSyncStatus();
  const online = useOnline();

  // A link the device believes it has but that carries nothing would hold this
  // screen up for as long as a request's own bound: waiting is for a server
  // that is answering.
  useEffect(() => {
    if (completedAt === null || answered) return;
    const timer = setTimeout(onEnter, FIRST_ANSWER_MS);
    return () => clearTimeout(timer);
  }, [completedAt, answered, onEnter]);

  return (
    <Gate
      icon={IconCloudDownload}
      title="Preparando este dispositivo"
      text="Se baja todo lo de la casa; después anda sin conexión."
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
        <PullRow label="Archivos de documentos y viajes" {...filesState(files)} />
      </ul>
      {!online && <p className="mt-4 text-sm text-muted">Sin conexión: sigue cuando vuelva.</p>}
      <Button variant="link" className="mt-6" onClick={onEnter}>
        Entrar mientras tanto
      </Button>
    </Gate>
  );
}
