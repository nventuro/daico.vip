import { useLeave } from '../../hooks/useLeave';
import { useEntry } from '../../hooks/useEntry';
import EntryPage from '../../components/EntryPage';
import { appPath } from '../types';
import { useDates, type DateInput } from './useDates';
import DateForm from './DateForm';

export default function DateEditPage() {
  const { items, loading, error, save, remove } = useDates();
  const entry = useEntry(items);
  const leave = useLeave();

  return (
    <EntryPage entry={entry} loading={loading} error={error} missing="Fecha no encontrada.">
      {(entry) => (
        <DateForm
          key={entry.id}
          entry={entry}
          onSave={async (input: DateInput) => {
            await save(entry.id, input);
            leave(appPath('fechas'));
          }}
          onRemove={async () => {
            await remove(entry.id);
            leave(appPath('fechas'));
          }}
        />
      )}
    </EntryPage>
  );
}
