import type { ReactNode } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  IconCloudOff,
  IconCloudUpload,
  IconDeviceMobileCheck,
  IconExternalLink,
  IconFileText,
  IconShare,
} from '@tabler/icons-react';
import type { AttachmentOwner } from '../types';
import { useOnline } from '../hooks/useOnline';
import { useObjectUrl } from '../hooks/useObjectUrl';
import { useAttachments } from '../hooks/useAttachments';
import { useAttachmentFile } from '../hooks/useAttachmentFile';
import { useAttachmentUploadState } from '../hooks/useAttachmentUploadState';
import Button from './Button';
import FormFooter from './FormFooter';

/** What an attachment's screens need to know about the entry it belongs to. */
export interface AttachmentOwnerProps {
  owner: AttachmentOwner;
  /** The entry's title, once it is loaded. */
  ownerTitle: string | undefined;
  /** The entry's own page, which its attachments' screens hang under. */
  ownerPath: string;
}

/** One attachment: the picture or the PDF's face, its name, a way to get it
 *  out of the app, and its deletion behind the usual confirm. */
export default function AttachmentPage({ owner, ownerTitle, ownerPath }: AttachmentOwnerProps) {
  const { attachmentId } = useParams();
  const navigate = useNavigate();
  const { items, loading, remove } = useAttachments(owner);
  const attachment = items.find((a) => a.id === attachmentId);
  const view = useAttachmentFile(attachment, true);
  const url = useObjectUrl(view.status === 'ready' ? view.file : null);
  const uploadState = useAttachmentUploadState(attachmentId ?? '');
  const online = useOnline();

  if (loading) return <p className="text-muted">Cargando...</p>;
  if (!attachment) return <p className="text-muted">Adjunto no encontrado.</p>;

  const isImage = attachment.mime.startsWith('image/');
  const file = view.status === 'ready' ? view.file : null;
  // The device's share sheet takes files on Android; desktop Firefox has none,
  // so there a picture is saved and a PDF opens in a tab of its own.
  const canShare = file !== null && navigator.canShare?.({ files: [file] }) === true;

  function open() {
    if (!file || !url) return;
    if (canShare) {
      void navigator.share({ files: [file], title: attachment?.name || undefined });
    } else if (isImage) {
      const link = document.createElement('a');
      link.href = url;
      link.download = file.name;
      link.click();
    } else {
      window.open(url, '_blank', 'noopener');
    }
  }

  async function handleRemove() {
    if (!attachment) return;
    await remove(attachment);
    navigate(ownerPath);
  }

  let hint: ReactNode = null;
  if (uploadState === 'pending') {
    hint = (
      <span className="inline-flex items-center gap-1.5">
        <IconCloudUpload size={16} stroke={1.5} className="shrink-0 text-warning" />
        Todavía no se subió. Se sube solo cuando haya conexión.
      </span>
    );
  } else if (uploadState === 'failed') {
    hint = (
      <span className="inline-flex items-center gap-1.5 text-error">
        <IconCloudOff size={16} stroke={1.5} className="shrink-0" />
        No se pudo subir: el servidor no aceptó el archivo.
      </span>
    );
  } else if (view.status === 'unavailable') {
    hint = online
      ? 'Todavía no se subió desde el dispositivo donde se agregó.'
      : 'Sin conexión, y este adjunto no está guardado en este dispositivo.';
  } else if (owner.kind === 'document' && uploadState === 'uploaded') {
    // Said only of a document: being readable with no connection is what it
    // is kept here for, not a side effect of having been opened once.
    hint = (
      <span className="inline-flex items-center gap-1.5">
        <IconDeviceMobileCheck size={16} stroke={1.5} className="shrink-0" />
        Guardado en este dispositivo: se ve sin conexión.
      </span>
    );
  } else if (!isImage && file) {
    hint = canShare ? 'Se abre con el visor del teléfono.' : 'Se abre en otra pestaña.';
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex min-h-60 items-center justify-center overflow-hidden border border-border bg-surface-raised">
        {isImage && url ? (
          <img src={url} alt={attachment.name} className="h-auto max-w-full" />
        ) : file ? (
          <span className="flex flex-col items-center gap-1 py-16 text-muted">
            <IconFileText size={64} stroke={1.25} />
            <span className="text-xs font-medium tracking-widest">PDF</span>
          </span>
        ) : (
          <span className="text-sm text-muted">
            {view.status === 'loading' ? 'Cargando...' : 'No disponible'}
          </span>
        )}
      </div>

      <div className="flex flex-col">
        <span className={attachment.name ? 'font-medium' : 'text-muted'}>
          {attachment.name || 'sin nombre'}
        </span>
        {ownerTitle && <span className="text-sm text-muted">{ownerTitle}</span>}
        {hint && <span className="mt-2 text-sm text-muted">{hint}</span>}
      </div>

      <FormFooter
        removeLabel="Eliminar adjunto"
        confirmQuestion="¿Eliminar el adjunto?"
        onRemove={handleRemove}
        action={
          <Button onClick={open} disabled={!file} className="flex items-center gap-2">
            {isImage ? (
              <>
                <IconShare size={18} stroke={1.75} />
                {canShare ? 'Compartir' : 'Descargar'}
              </>
            ) : (
              <>
                <IconExternalLink size={18} stroke={1.75} />
                Abrir
              </>
            )}
          </Button>
        }
      />
    </div>
  );
}
