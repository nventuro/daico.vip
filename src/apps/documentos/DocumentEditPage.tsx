import { useNavigate } from 'react-router-dom';
import { useAttachments } from '../../hooks/useAttachments';
import { useEntry } from '../../hooks/useEntry';
import EntryPage from '../../components/EntryPage';
import { appPath } from '../types';
import { useDocuments, type DocumentInput } from './useDocuments';
import DocumentForm from './DocumentForm';

export default function DocumentEditPage() {
  const { items, loading, error, save, remove } = useDocuments();
  const entry = useEntry(items);
  const attachments = useAttachments({ kind: 'document', id: entry?.id ?? '' });
  const navigate = useNavigate();

  return (
    <EntryPage entry={entry} loading={loading} error={error} missing="Documento no encontrado.">
      {(entry) => (
        <DocumentForm
          key={entry.id}
          entry={entry}
          onSave={async (input: DocumentInput) => {
            await save(entry.id, input);
            navigate(appPath('documentos'));
          }}
          onRemove={async () => {
            // The document's files go with it; nothing else would ever list them.
            await attachments.removeAll();
            await remove(entry.id);
            navigate(appPath('documentos'));
          }}
        />
      )}
    </EntryPage>
  );
}
