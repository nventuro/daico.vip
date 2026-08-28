import { useNavigate, useParams } from 'react-router-dom';
import type { DateInput } from './useDates';
import { useDates } from './useDates';
import DateForm from './DateForm';
import SkeletonRows from '../../components/SkeletonRows';

export default function DateEditPage() {
  const { id } = useParams();
  const { items, loading, error, save, remove } = useDates();
  const navigate = useNavigate();

  const entry = items.find((e) => e.id === id);

  if (loading) return <SkeletonRows />;
  if (!entry) return <p className="text-muted">Fecha no encontrada.</p>;

  const handleSave = async (input: DateInput) => {
    await save(entry.id, input);
    navigate('/fechas');
  };

  const handleRemove = async () => {
    await remove(entry);
    navigate('/fechas');
  };

  return (
    <>
      {error && <p className="mb-4 text-sm text-error">Error: {error}</p>}
      <DateForm key={entry.id} entry={entry} onSave={handleSave} onRemove={handleRemove} />
    </>
  );
}
