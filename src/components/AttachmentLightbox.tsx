import { useCallback, useEffect, useRef, type ReactNode, type TouchEvent } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  IconChevronLeft,
  IconChevronRight,
  IconCloudOff,
  IconCloudUpload,
  IconDeviceMobileCheck,
  IconShare,
  IconX,
} from '@tabler/icons-react';
import { LIGHTBOX_FROM_ENTRY_PAGE, LIGHTBOX_SWIPE_MIN_PX, type Attachment } from '../types';
import { useOnline } from '../hooks/useOnline';
import { useObjectUrl } from '../hooks/useObjectUrl';
import { useAttachmentFile } from '../hooks/useAttachmentFile';
import { useAttachmentUploadState } from '../hooks/useAttachmentUploadState';
import Button from './Button';
import FormFooter from './FormFooter';
import ModalDialog from './ModalDialog';
import LoadingLine from './LoadingLine';

function isFromEntryPage(state: unknown): boolean {
  return (
    typeof state === 'object' &&
    state !== null &&
    (state as Partial<typeof LIGHTBOX_FROM_ENTRY_PAGE>).fromEntryPage === true
  );
}

interface AttachmentLightboxProps {
  /** The entry's attachments in the grid's order; the lightbox moves along them. */
  attachments: Attachment[];
  /** Which one is open. */
  index: number;
  /** The entry's own page: the attachments' URLs hang under it, and closing returns to it. */
  ownerPath: string;
  onRemove: (attachment: Attachment) => void;
}

/**
 * One attachment full-screen, with the entry's others a swipe (or an arrow
 * key) away. Which one is open is the `:attachmentId` ending the URL, so a
 * picture can be linked to and the phone's back gesture closes it. Under the
 * picture: its name, where its file stands, a way to get it out of the app,
 * and its deletion behind the usual confirm.
 */
export default function AttachmentLightbox({
  attachments,
  index,
  ownerPath,
  onRemove,
}: AttachmentLightboxProps) {
  const attachment = attachments[index];
  const navigate = useNavigate();
  const location = useLocation();
  const view = useAttachmentFile(attachment);
  const url = useObjectUrl(view.status === 'ready' ? view.file : null);
  const uploadState = useAttachmentUploadState(attachment.id);
  const online = useOnline();
  const touchStartX = useRef<number | null>(null);

  const close = useCallback(() => {
    // Opened from the entry's page, that page is the previous history entry;
    // reached by a link from elsewhere, it is not, and takes this one's place.
    if (isFromEntryPage(location.state)) navigate(-1);
    else navigate(ownerPath, { replace: true });
  }, [location.state, navigate, ownerPath]);

  const show = useCallback(
    (i: number) =>
      navigate(`${ownerPath}/${attachments[i].id}`, { replace: true, state: location.state }),
    [attachments, location.state, navigate, ownerPath],
  );
  const hasPrev = index > 0;
  const hasNext = index < attachments.length - 1;

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'ArrowLeft' && hasPrev) show(index - 1);
      if (e.key === 'ArrowRight' && hasNext) show(index + 1);
    }
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [show, index, hasPrev, hasNext]);

  function touchEnd(e: TouchEvent) {
    if (touchStartX.current === null) return;
    const delta = e.changedTouches[0].clientX - touchStartX.current;
    touchStartX.current = null;
    if (delta > LIGHTBOX_SWIPE_MIN_PX && hasPrev) show(index - 1);
    if (delta < -LIGHTBOX_SWIPE_MIN_PX && hasNext) show(index + 1);
  }

  const file = view.status === 'ready' ? view.file : null;
  // The device's share sheet takes files on Android; desktop Firefox has none,
  // so there the picture is saved.
  const canShare = file !== null && navigator.canShare?.({ files: [file] }) === true;

  function open() {
    if (!file || !url) return;
    if (canShare) {
      void navigator.share({ files: [file], title: attachment.name || undefined });
    } else {
      const link = document.createElement('a');
      link.href = url;
      link.download = file.name;
      link.click();
    }
  }

  function handleRemove() {
    close();
    onRemove(attachment);
  }

  let hint: ReactNode = null;
  if (uploadState === 'pending') {
    hint = (
      <span className="inline-flex items-center gap-1.5">
        <IconCloudUpload size={16} stroke={1.5} className="shrink-0 text-warning" />
        Todavía no se subió. Se sube sola cuando haya conexión.
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
      : 'Sin conexión, y esta foto no está guardada en este dispositivo.';
  } else if (attachment.owner_kind === 'document' && uploadState === 'uploaded') {
    // Said only of a document: being readable with no connection is what it
    // is kept here for, not a side effect of having been opened once.
    hint = (
      <span className="inline-flex items-center gap-1.5">
        <IconDeviceMobileCheck size={16} stroke={1.5} className="shrink-0" />
        Guardada en este dispositivo: se ve sin conexión.
      </span>
    );
  }

  return (
    <ModalDialog
      onClose={close}
      className="fixed inset-0 m-0 h-dvh max-h-none w-screen max-w-none bg-surface-inverse p-0 text-on-surface-inverse backdrop:bg-transparent"
    >
      <div className="flex h-full flex-col">
        <div className="flex shrink-0 items-center justify-between px-2 py-2">
          <button
            type="button"
            onClick={close}
            aria-label="Cerrar"
            title="Cerrar"
            className="flex items-center p-2 transition-opacity hover:opacity-70"
          >
            <IconX size={22} stroke={1.75} />
          </button>
          <span className="text-sm opacity-70">
            {index + 1} / {attachments.length}
          </span>
          {/* Balances the close button so the count sits in the middle. */}
          <span aria-hidden className="w-10" />
        </div>

        <div
          className="relative min-h-0 flex-1"
          onTouchStart={(e) => {
            touchStartX.current = e.touches[0].clientX;
          }}
          onTouchEnd={touchEnd}
        >
          {url ? (
            <img
              src={url}
              alt={attachment.name}
              className="absolute inset-0 h-full w-full object-contain"
            />
          ) : view.status === 'loading' ? (
            <LoadingLine inverse className="absolute inset-x-0 bottom-0" />
          ) : (
            <span className="absolute inset-0 flex items-center justify-center text-sm opacity-70">
              No disponible
            </span>
          )}
          {hasPrev && (
            <button
              type="button"
              onClick={() => show(index - 1)}
              aria-label="Anterior"
              title="Anterior"
              className="absolute top-1/2 left-0 -translate-y-1/2 p-3 opacity-70 transition-opacity hover:opacity-100"
            >
              <IconChevronLeft size={32} stroke={1.5} />
            </button>
          )}
          {hasNext && (
            <button
              type="button"
              onClick={() => show(index + 1)}
              aria-label="Siguiente"
              title="Siguiente"
              className="absolute top-1/2 right-0 -translate-y-1/2 p-3 opacity-70 transition-opacity hover:opacity-100"
            >
              <IconChevronRight size={32} stroke={1.5} />
            </button>
          )}
        </div>

        <div className="flex shrink-0 flex-col gap-3 bg-surface px-4 py-3 text-on-surface">
          {(attachment.name || hint) && (
            <div className="flex flex-col">
              {attachment.name && <span className="font-medium">{attachment.name}</span>}
              {hint && (
                <span className={`text-sm text-muted ${attachment.name ? 'mt-1' : ''}`}>
                  {hint}
                </span>
              )}
            </div>
          )}
          <FormFooter
            removeLabel="Eliminar foto"
            confirmQuestion="¿Eliminar la foto?"
            onRemove={handleRemove}
            action={
              <Button onClick={open} disabled={!file} className="flex items-center gap-2">
                <IconShare size={18} stroke={1.75} />
                {canShare ? 'Compartir' : 'Descargar'}
              </Button>
            }
          />
        </div>
      </div>
    </ModalDialog>
  );
}
