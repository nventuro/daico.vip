import { useLeave } from '../../hooks/useLeave';
import { useAttachments } from '../../hooks/useAttachments';
import { useEntry } from '../../hooks/useEntry';
import { appPath } from '../types';
import { useChores, type ChoreInput } from './useChores';
import ChoreForm from './ChoreForm';
import EntryPage from '../../components/EntryPage';

export default function ChoreEditPage() {
  const { items, loading, error, save, remove } = useChores();
  const chore = useEntry(items);
  const attachments = useAttachments({ kind: 'chore', id: chore?.id ?? '' });
  const leave = useLeave();

  return (
    <EntryPage entry={chore} loading={loading} error={error} missing="Tarea no encontrada.">
      {(chore) => (
        <ChoreForm
          key={chore.id}
          chore={chore}
          onSave={async (input: ChoreInput) => {
            await save(chore.id, input);
            leave(appPath('tareas'));
          }}
          onRemove={async () => {
            // The chore's attachments go with it; nothing else would ever list them.
            await attachments.removeAll();
            await remove(chore.id);
            leave(appPath('tareas'));
          }}
        />
      )}
    </EntryPage>
  );
}
