import { Link } from 'react-router-dom';
import { IconCloudOff, IconCloudUpload, IconPhoto } from '@tabler/icons-react';
import { LIGHTBOX_FROM_ENTRY_PAGE, type Attachment } from '../types';
import { useObjectUrl } from '../hooks/useObjectUrl';
import { useAttachmentFile } from '../hooks/useAttachmentFile';
import { useAttachmentUploadState } from '../hooks/useAttachmentUploadState';

interface AttachmentTileProps {
  attachment: Attachment;
  /** Where the tile opens: the attachment's own URL, which brings up the lightbox. */
  to: string;
}

/**
 * One square of an entry's attachment grid: the picture itself once it is on
 * this device (it is fetched for the tile, since the picture is the tile),
 * the name under it, and a cloud when the file has not reached the server yet.
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
          <span className="flex h-full items-center justify-center text-muted">
            <IconPhoto size={30} stroke={1.25} />
          </span>
        )}
        {uploadState === 'pending' && (
          <span
            title="Todavía no se subió"
            className="absolute right-1 bottom-1 flex border border-border bg-surface p-0.5 text-muted"
          >
            <IconCloudUpload size={14} stroke={1.75} aria-label="Todavía no se subió" />
          </span>
        )}
        {uploadState === 'failed' && (
          <span
            title="No se pudo subir"
            className="absolute right-1 bottom-1 flex border border-border bg-surface p-0.5 text-error"
          >
            <IconCloudOff size={14} stroke={1.75} aria-label="No se pudo subir" />
          </span>
        )}
      </span>
      <span className="truncate text-xs text-muted">{attachment.name || ' '}</span>
    </Link>
  );
}
