import { useState, type FormEvent } from 'react';
import { Navigate, useNavigate, useParams } from 'react-router-dom';
import { IconFileText } from '@tabler/icons-react';
import { formatBytes } from '../../utils/textUtils';
import { useObjectUrl } from '../../hooks/useObjectUrl';
import FormField from '../../components/FormField';
import TextInput from '../../components/TextInput';
import Button from '../../components/Button';
import { useChores } from './useChores';
import { useAttachments } from './useAttachments';
import { useAttachmentFile } from './useAttachmentFile';

/**
 * Names the attachment just added to a chore (the file is already stored, so a
 * reload here loses nothing — it only leaves the attachment unnamed). Cancelar
 * undoes the add; Guardar keeps it, named or not.
 */
export default function NewAttachmentPage() {
  const { id, attachmentId } = useParams();
  const navigate = useNavigate();
  const { items: chores } = useChores();
  const { items, loading, rename, remove } = useAttachments(id);
  const attachment = items.find((a) => a.id === attachmentId);
  const isImage = attachment?.mime.startsWith('image/') ?? false;
  const view = useAttachmentFile(isImage ? attachment : undefined, false);
  const preview = useObjectUrl(view.status === 'ready' ? view.file : null);
  const [name, setName] = useState('');
  const [busy, setBusy] = useState(false);

  const chorePath = `/tareas/${id}`;
  // Loaded and not there: it was undone, or the link is stale.
  if (!loading && !attachment) return <Navigate to={chorePath} replace />;
  if (!attachment) return <p className="text-muted">Cargando...</p>;
  const chore = chores.find((c) => c.id === id);

  async function save(e: FormEvent) {
    e.preventDefault();
    if (!attachment || busy) return;
    setBusy(true);
    await rename(attachment.id, name);
    navigate(chorePath);
  }

  async function cancel() {
    if (!attachment || busy) return;
    setBusy(true);
    await remove(attachment);
    navigate(chorePath);
  }

  return (
    <form onSubmit={save} className="flex flex-col gap-4">
      <div className="flex flex-col gap-1 text-sm text-muted">
        <span>{chore ? `${chore.title} · nuevo adjunto` : 'Nuevo adjunto'}</span>
        <div className="flex h-60 items-center justify-center overflow-hidden border border-border bg-surface-raised">
          {preview ? (
            <img src={preview} alt="" className="h-full w-full object-contain" />
          ) : (
            <span className="flex flex-col items-center gap-1">
              <IconFileText size={48} stroke={1.25} />
              {!isImage && <span className="text-xs font-medium tracking-widest">PDF</span>}
            </span>
          )}
        </div>
        <span className="text-xs">{formatBytes(attachment.size)}</span>
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
        <Button variant="outline" onClick={cancel} disabled={busy}>
          Cancelar
        </Button>
        <Button type="submit" disabled={busy}>
          Guardar
        </Button>
      </div>
    </form>
  );
}
