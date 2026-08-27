import { useState, type FormEvent } from 'react';
import { Navigate, useNavigate, useParams } from 'react-router-dom';
import { IconFileText } from '@tabler/icons-react';
import { formatBytes } from '../../utils/textUtils';
import { useObjectUrl } from '../../hooks/useObjectUrl';
import { useMasterKey } from '../../hooks/useMasterKey';
import FormField from '../../components/FormField';
import TextInput from '../../components/TextInput';
import Button from '../../components/Button';
import { useChores } from './useChores';
import { useAttachments } from './useAttachments';
import { takeAttachmentDraft } from './attachmentDraft';

/** Names the file just picked for a chore and adds it. Reached only from the
 *  picker: with no picked file in hand it goes back to the chore. */
export default function NewAttachmentPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [file] = useState(takeAttachmentDraft);
  const { items: chores } = useChores();
  const { add } = useAttachments(id);
  const masterKey = useMasterKey();
  const [name, setName] = useState('');
  const [saving, setSaving] = useState(false);
  const preview = useObjectUrl(file?.type.startsWith('image/') ? file : null);

  const chorePath = `/tareas/${id}`;
  if (!file || !id) return <Navigate to={chorePath} replace />;
  const chore = chores.find((c) => c.id === id);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!file || !id || masterKey.status !== 'unlocked' || saving) return;
    setSaving(true);
    await add(id, file, name, masterKey.key);
    navigate(chorePath);
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <div className="flex flex-col gap-1 text-sm text-muted">
        <span>{chore ? `${chore.title} · nuevo adjunto` : 'Nuevo adjunto'}</span>
        <div className="flex h-60 items-center justify-center overflow-hidden border border-border bg-surface-raised">
          {preview ? (
            <img src={preview} alt="" className="h-full w-full object-contain" />
          ) : (
            <span className="flex flex-col items-center gap-1">
              <IconFileText size={48} stroke={1.25} />
              <span className="text-xs font-medium tracking-widest">PDF</span>
            </span>
          )}
        </div>
        <span className="text-xs">
          {file.name} · {formatBytes(file.size)}
        </span>
      </div>

      <FormField label="Nombre">
        <TextInput
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="opcional"
          aria-label="Nombre"
          autoCapitalize="none"
        />
      </FormField>

      <div className="mt-2 flex items-center justify-between gap-3">
        <Button variant="outline" onClick={() => navigate(chorePath)}>
          Cancelar
        </Button>
        <Button type="submit" disabled={saving || masterKey.status !== 'unlocked'}>
          Agregar
        </Button>
      </div>
    </form>
  );
}
