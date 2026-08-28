import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import OfflineBanner from '../../components/OfflineBanner';
import AddBar from '../../components/AddBar';
import { todayIso } from '../../utils/dateUtils';
import { useDocuments } from './useDocuments';
import { expiryLabel, hasExpired } from './expiry';
import SkeletonRows from '../../components/SkeletonRows';

export default function DocumentsPage() {
  const { items, loading, error, add } = useDocuments();
  const navigate = useNavigate();
  const [newTitle, setNewTitle] = useState('');
  const today = todayIso();

  async function addDocument() {
    const title = newTitle.trim();
    if (!title) return;
    setNewTitle('');
    const id = await add(title);
    // A new document is just a title: go straight to attaching its files.
    if (id) navigate(`/documentos/${id}`);
  }

  return (
    <div className="flex flex-1 flex-col">
      <div className="flex-1">
        <OfflineBanner />

        {error && <p className="mb-4 text-sm text-error">Error: {error}</p>}

        {loading ? (
          <SkeletonRows subtitle />
        ) : items.length === 0 ? (
          <p className="py-10 text-center text-muted">Todavía no hay documentos.</p>
        ) : (
          <ul>
            {items.map((entry) => (
              <li key={entry.id} className="border-b border-border">
                <Link to={`/documentos/${entry.id}`} className="flex flex-col py-2.5">
                  <span className="truncate text-on-surface">{entry.title}</span>
                  {entry.expires_on && (
                    <span
                      className={`mt-0.5 text-xs ${
                        hasExpired(entry.expires_on, today) ? 'text-error' : 'text-muted'
                      }`}
                    >
                      {expiryLabel(entry.expires_on, today)}
                    </span>
                  )}
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>

      <AddBar
        value={newTitle}
        onChange={setNewTitle}
        onSubmit={() => void addDocument()}
        placeholder="Agregar un documento..."
        inputLabel="Nuevo documento"
      />
    </div>
  );
}
