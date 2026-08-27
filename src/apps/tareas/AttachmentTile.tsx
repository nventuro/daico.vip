import { Link } from 'react-router-dom';
import { IconCloudOff, IconCloudUpload, IconFileText, IconPhoto } from '@tabler/icons-react';
import type { Attachment } from '../../types';
import { useObjectUrl } from '../../hooks/useObjectUrl';
import { useAttachmentFile } from './useAttachmentFile';
import { useAttachmentUploadState } from './useAttachmentUploadState';

interface AttachmentTileProps {
  attachment: Attachment;
  /** Where the tile opens: the attachment's own screen. */
  to: string;
}

/**
 * One square of a chore's attachment grid: the picture itself once it is on
 * this device (an image is fetched for it, since the picture is the tile), a
 * file icon for a PDF, the name under it, and a cloud when the file has not
 * reached the server yet.
 */
export default function AttachmentTile({ attachment, to }: AttachmentTileProps) {
  const isImage = attachment.mime.startsWith('image/');
  const view = useAttachmentFile(isImage ? attachment : undefined, true);
  const url = useObjectUrl(view.status === 'ready' ? view.file : null);
  const uploadState = useAttachmentUploadState(attachment.id);

  return (
    <Link to={to} className="flex min-w-0 flex-col gap-1">
      <span className="relative block aspect-square overflow-hidden border border-border bg-surface-raised">
        {url ? (
          <img src={url} alt="" className="h-full w-full object-cover" />
        ) : (
          <span className="flex h-full flex-col items-center justify-center gap-1 text-muted">
            {isImage ? (
              <IconPhoto size={30} stroke={1.25} />
            ) : (
              <>
                <IconFileText size={30} stroke={1.25} />
                <span className="text-xs font-medium tracking-widest">PDF</span>
              </>
            )}
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
      <span className="truncate text-xs text-muted">{attachment.name || ' '}</span>
    </Link>
  );
}
