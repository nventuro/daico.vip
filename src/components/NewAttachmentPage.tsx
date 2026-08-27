import { useState, type FormEvent } from 'react';
import { Navigate, useNavigate, useParams } from 'react-router-dom';
import { IconFileText } from '@tabler/icons-react';
import { formatBytes } from '../utils/textUtils';
import { useObjectUrl } from '../hooks/useObjectUrl';
import { useAttachments } from '../hooks/useAttachments';
import { useAttachmentFile } from '../hooks/useAttachmentFile';
import FormField from './FormField';
import TextInput from './TextInput';
import Button from './Button';
import type { AttachmentOwnerProps } from './AttachmentPage';

/**
 * Names the attachment just added to an entry (the file is already stored, so
 * a reload here loses nothing — it only leaves the attachment unnamed).
 * Cancelar undoes the add; Guardar keeps it, named or not.
 */
export default function NewAttachmentPage({ owner, ownerTitle, ownerPath }: AttachmentOwnerProps) {
  const { attachmentId } = useParams();
  const navigate = useNavigate();
  const { items, loading, rename, remove } = useAttachments(owner);
  const attachment = items.find((a) => a.id === attachmentId);
  const isImage = attachment?.mime.startsWith('image/') ?? false;
  const view = useAttachmentFile(isImage ? attachment : undefined, false);
  const preview = useObjectUrl(view.status === 'ready' ? view.file : null);
  const [name, setName] = useState('');
  const [busy, setBusy] = useState(false);

  // Loaded and not there: it was undone, or the link is stale.
  if (!loading && !attachment) return <Navigate to={ownerPath} replace />;
  if (!attachment) return <p className="text-muted">Cargando...</p>;

  async function save(e: FormEvent) {
    e.preventDefault();
    if (!attachment || busy) return;
    setBusy(true);
    await rename(attachment.id, name);
    navigate(ownerPath);
  }

  async function cancel() {
    if (!attachment || busy) return;
    setBusy(true);
    await remove(attachment);
    navigate(ownerPath);
  }

  return (
    <form onSubmit={save} className="flex flex-col gap-4">
      <div className="flex flex-col gap-1 text-sm text-muted">
        <span>{ownerTitle ? `${ownerTitle} · nuevo adjunto` : 'Nuevo adjunto'}</span>
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
