import { Link } from 'react-router-dom';
import { IconCloudOff, IconCloudUpload, IconPhoto } from '@tabler/icons-react';
import { LIGHTBOX_FROM_ENTRY_PAGE, type Attachment } from '../types';
import { useObjectUrl } from '../hooks/useObjectUrl';
import { useAttachmentFile } from '../hooks/useAttachmentFile';
import { useAttachmentUploadState } from '../hooks/useAttachmentUploadState';
import LoadingLine from './LoadingLine';

interface AttachmentTileProps {
  attachment: Attachment;
  /** Where the tile opens: the attachment's own URL, which brings up the lightbox. */
  to: string;
}

/** A small mark in the tile's corner saying where the file stands. */
function Badge({
  icon: Icon,
  text,
  className = 'text-muted',
}: {
  icon: typeof IconCloudOff;
  text: string;
  className?: string;
}) {
  return (
    <span
      title={text}
      className={`absolute right-1 bottom-1 flex border border-border bg-surface p-0.5 ${className}`}
    >
      <Icon size={14} stroke={1.75} aria-label={text} />
    </span>
  );
}

/**
 * One square of an entry's attachment grid: the picture itself once it is on
 * this device (it is fetched for the tile, since the picture is the tile),
 * the name under it, and a mark when the file is still on its way, could not
 * be fetched, or has not reached the server yet.
 */
export default function AttachmentTile({ attachment, to }: AttachmentTileProps) {
  const view = useAttachmentFile(attachment);
  const url = useObjectUrl(view.status === 'ready' ? view.file : null);
  const uploadState = useAttachmentUploadState(attachment.id);

  return (
    <Link to={to} state={LIGHTBOX_FROM_ENTRY_PAGE} className="flex min-w-0 flex-col gap-1">
      <span className="relative block aspect-square overflow-hidden border border-border bg-surface-raised">
        {url ? (
          <img src={url} alt="" className="h-full w-full object-cover" />
        ) : (
          <span
            className={`flex h-full items-center justify-center ${
              view.status === 'loading' ? 'text-disabled' : 'text-muted'
            }`}
          >
            <IconPhoto size={30} stroke={1.25} />
          </span>
        )}
        {view.status === 'loading' && <LoadingLine className="absolute inset-x-0 bottom-0" />}
        {view.status === 'unavailable' && <Badge icon={IconCloudOff} text="No se pudo bajar" />}
        {uploadState === 'pending' && <Badge icon={IconCloudUpload} text="Todavía no se subió" />}
        {uploadState === 'failed' && (
          <Badge icon={IconCloudOff} text="No se pudo subir" className="text-error" />
        )}
      </span>
      <span className="truncate text-xs text-muted">{attachment.name || ' '}</span>
    </Link>
  );
}
