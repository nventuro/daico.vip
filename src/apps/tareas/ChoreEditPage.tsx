import { useNavigate } from 'react-router-dom';
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
  const navigate = useNavigate();

  return (
    <EntryPage entry={chore} loading={loading} error={error} missing="Tarea no encontrada.">
      {(chore) => (
        <ChoreForm
          key={chore.id}
          chore={chore}
          onSave={async (input: ChoreInput) => {
            await save(chore.id, input);
            navigate(appPath('tareas'));
          }}
          onRemove={async () => {
            // The chore's attachments go with it; nothing else would ever list them.
            await attachments.removeAll();
            await remove(chore.id);
            navigate(appPath('tareas'));
          }}
        />
      )}
    </EntryPage>
  );
}
