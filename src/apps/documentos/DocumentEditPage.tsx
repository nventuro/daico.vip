import { useNavigate, useParams } from 'react-router-dom';
import { useAttachments } from '../../hooks/useAttachments';
import type { DocumentInput } from './useDocuments';
import { useDocuments } from './useDocuments';
import DocumentForm from './DocumentForm';

export default function DocumentEditPage() {
  const { id } = useParams();
  const { items, loading, error, save, remove } = useDocuments();
  const attachments = useAttachments({ kind: 'document', id: id ?? '' });
  const navigate = useNavigate();

  const entry = items.find((d) => d.id === id);

  if (loading) return <p className="text-muted">Cargando...</p>;
  if (!entry) return <p className="text-muted">Documento no encontrado.</p>;

  const handleSave = async (input: DocumentInput) => {
    await save(entry.id, input);
    navigate('/documentos');
  };

  const handleRemove = async () => {
    // The document's files go with it; nothing else would ever list them.
    for (const attachment of attachments.items) await attachments.remove(attachment);
    await remove(entry);
    navigate('/documentos');
  };

  return (
    <>
      {error && <p className="mb-4 text-sm text-error">Error: {error}</p>}
      <DocumentForm key={entry.id} entry={entry} onSave={handleSave} onRemove={handleRemove} />
    </>
  );
}
