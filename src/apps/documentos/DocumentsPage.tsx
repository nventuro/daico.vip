import { useNavigate } from 'react-router-dom';
import { draftTitleState } from '../../hooks/useDraftTitle';
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
  const { items, loading, error } = useDocuments();
  const navigate = useNavigate();
  const today = todayIso();

  return (
    <ListPage
      loading={loading}
      error={error}
      skeleton={<SkeletonRows subtitle />}
      bar={
        <AddBar
          // The document is written on save: the title goes on to the form,
          // and nothing is written until it is saved there.
          onAdd={(title) =>
            navigate(entryPath('documentos', 'nuevo'), { state: draftTitleState(title) })
          }
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
