import { useNavigate } from 'react-router-dom';
import { isPast, todayIso } from '../../utils/dateUtils';
import AddBar from '../../components/AddBar';
import EmptyState from '../../components/EmptyState';
import LinkRow from '../../components/LinkRow';
import ListPage from '../../components/ListPage';
import SkeletonRows from '../../components/SkeletonRows';
import { entryPath } from '../types';
import { useDocuments } from './useDocuments';
import { expiryLabel } from './expiry';

export default function DocumentsPage() {
  const { items, loading, error, add } = useDocuments();
  const navigate = useNavigate();
  const today = todayIso();

  async function addDocument(title: string) {
    const id = await add(title);
    // A new document is just a title: go straight to attaching its files.
    if (id) navigate(entryPath('documentos', id));
  }

  return (
    <ListPage
      loading={loading}
      error={error}
      skeleton={<SkeletonRows subtitle />}
      bar={
        <AddBar
          onAdd={(title) => void addDocument(title)}
          placeholder="Agregar un documento..."
          inputLabel="Nuevo documento"
        />
      }
    >
      {items.length === 0 ? (
        <EmptyState>Todavía no hay documentos.</EmptyState>
      ) : (
        <ul>
          {items.map((entry) => (
            <LinkRow
              key={entry.id}
              to={entryPath('documentos', entry.id)}
              title={entry.title}
              subtitle={entry.expires_on ? expiryLabel(entry.expires_on, today) : undefined}
              overdue={entry.expires_on !== null && isPast(entry.expires_on, today)}
            />
          ))}
        </ul>
      )}
    </ListPage>
  );
}
