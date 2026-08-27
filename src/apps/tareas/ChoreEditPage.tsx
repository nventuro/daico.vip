import { useNavigate, useParams } from 'react-router-dom';
import type { ChoreInput } from './useChores';
import { useChores } from './useChores';
import { useAttachments } from './useAttachments';
import ChoreForm from './ChoreForm';

export default function ChoreEditPage() {
  const { id } = useParams();
  const { items, loading, error, save, remove } = useChores();
  const attachments = useAttachments(id);
  const navigate = useNavigate();

  const chore = items.find((c) => c.id === id);

  if (loading) return <p className="text-muted">Cargando...</p>;
  if (!chore) return <p className="text-muted">Tarea no encontrada.</p>;

  const handleSave = async (input: ChoreInput) => {
    await save(chore.id, input);
    navigate('/tareas');
  };

  const handleRemove = async () => {
    // The chore's attachments go with it; nothing else would ever list them.
    for (const attachment of attachments.items) await attachments.remove(attachment);
    await remove(chore);
    navigate('/tareas');
  };

  return (
    <>
      {error && <p className="mb-4 text-sm text-error">Error: {error}</p>}
      <ChoreForm key={chore.id} chore={chore} onSave={handleSave} onRemove={handleRemove} />
    </>
  );
}
