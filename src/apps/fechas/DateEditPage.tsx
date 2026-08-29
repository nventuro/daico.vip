import { useNavigate } from 'react-router-dom';
import { useEntry } from '../../hooks/useEntry';
import EntryPage from '../../components/EntryPage';
import { appPath } from '../types';
import { useDates, type DateInput } from './useDates';
import DateForm from './DateForm';

export default function DateEditPage() {
  const { items, loading, error, save, remove } = useDates();
  const entry = useEntry(items);
  const navigate = useNavigate();

  return (
    <EntryPage entry={entry} loading={loading} error={error} missing="Fecha no encontrada.">
      {(entry) => (
        <DateForm
          key={entry.id}
          entry={entry}
          onSave={async (input: DateInput) => {
            await save(entry.id, input);
            navigate(appPath('fechas'));
          }}
          onRemove={async () => {
            await remove(entry.id);
            navigate(appPath('fechas'));
          }}
        />
      )}
    </EntryPage>
  );
}
