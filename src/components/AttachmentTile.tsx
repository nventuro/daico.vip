import { Link } from 'react-router-dom';
import { IconCloudOff, IconCloudUpload, IconFileTypePdf, IconPhoto } from '@tabler/icons-react';
import type { Attachment } from '../lib/offline/specs';
import { isPdf } from '../lib/attachmentFiles';
import { LIGHTBOX_FROM_ENTRY_PAGE } from './AttachmentLightbox';
import { useObjectUrl } from '../hooks/useObjectUrl';
import { useAttachmentFile } from '../hooks/useAttachmentFile';
import { useAttachmentUploadState } from '../hooks/useAttachmentUploadState';
import { usePdf } from '../hooks/usePdf';
import LoadingLine from './LoadingLine';
import PdfPage from './PdfPage';

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
 * or a PDF's first page under a mark saying so; the name under it, and a
 * mark when the file is still on its way, could not be fetched, or has not
 * reached the server yet.
 */
export default function AttachmentTile({ attachment, to }: AttachmentTileProps) {
  const view = useAttachmentFile(attachment);
  const file = view.status === 'ready' ? view.file : null;
  const pdf = isPdf(attachment.mime);
  const url = useObjectUrl(pdf ? null : file);
  const pdfView = usePdf(pdf ? file : null);
  const uploadState = useAttachmentUploadState(attachment.id);
  const loading =
    view.status === 'loading' || (pdf && file !== null && pdfView.status === 'loading');
  const Icon = pdf ? IconFileTypePdf : IconPhoto;

  return (
    <Link to={to} state={LIGHTBOX_FROM_ENTRY_PAGE} className="flex min-w-0 flex-col gap-1">
      <span className="relative block aspect-square overflow-hidden border border-border bg-surface-raised">
        {url ? (
          <img src={url} alt="" className="h-full w-full object-cover" />
        ) : pdf && pdfView.status === 'ready' ? (
          <PdfPage pdf={pdfView.pdf} number={1} alt="" className="absolute inset-x-0 top-0" />
        ) : (
          <span
            className={`flex h-full items-center justify-center ${
              loading ? 'text-disabled' : 'text-muted'
            }`}
          >
            <Icon size={30} stroke={1.25} />
          </span>
        )}
        {pdf && (
          <span className="absolute bottom-1 left-1 border border-border bg-surface px-1 text-xs font-medium tracking-widest text-muted">
            PDF
          </span>
        )}
        {loading && <LoadingLine className="absolute inset-x-0 bottom-0" />}
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
