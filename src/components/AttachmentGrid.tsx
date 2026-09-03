import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { IconPlus } from '@tabler/icons-react';
import type { AttachmentOwner } from '../types';
import { useMasterKey } from '../hooks/useMasterKey';
import { useAttachments } from '../hooks/useAttachments';
import ErrorLine from './ErrorLine';
import AttachmentTile from './AttachmentTile';
import AttachmentAddDialog from './AttachmentAddDialog';
import AttachmentLightbox from './AttachmentLightbox';
import AttachmentPickDialog from './AttachmentPickDialog';

interface AttachmentGridProps {
  owner: AttachmentOwner;
  /** The entry's own page, which its attachments' URLs hang under. */
  ownerPath: string;
}

/**
 * An entry's attachments as a grid of tiles, ending in Agregar, which asks
 * whether pictures or a PDF are wanted, brings the device's picker up for
 * that kind — as many files as wanted at once — and takes what was picked
 * through the add dialog one by one. A tile opens its attachment in the
 * lightbox; the entry's route carries the open one as an optional
 * `:attachmentId`, read here.
 */
export default function AttachmentGrid({ owner, ownerPath }: AttachmentGridProps) {
  const { items, error, add, remove } = useAttachments(owner);
  const masterKey = useMasterKey();
  const { attachmentId } = useParams();
  const [asking, setAsking] = useState(false);
  const [picked, setPicked] = useState<File[] | null>(null);

  async function save(file: File, name: string) {
    if (masterKey.status !== 'unlocked') return false;
    return (await add(file, masterKey.key, name)) !== undefined;
  }

  const open = attachmentId ? items.findIndex((a) => a.id === attachmentId) : -1;

  return (
    <>
      <div className="mt-0.5 grid grid-cols-3 gap-2">
        {items.map((attachment) => (
          <AttachmentTile
            key={attachment.id}
            attachment={attachment}
            to={`${ownerPath}/${attachment.id}`}
          />
        ))}
        <button
          type="button"
          onClick={() => setAsking(true)}
          className="flex aspect-square flex-col items-center justify-center gap-0.5 border border-border bg-surface-raised text-muted transition-colors hover:text-muted-strong"
        >
          <IconPlus size={22} stroke={1.75} />
          <span className="text-xs">Agregar</span>
        </button>
      </div>
      <ErrorLine error={error} />
      {asking && (
        <AttachmentPickDialog
          onPick={(files) => {
            setAsking(false);
            setPicked(files);
          }}
          onClose={() => setAsking(false)}
        />
      )}
      {picked && (
        <AttachmentAddDialog files={picked} onSave={save} onClose={() => setPicked(null)} />
      )}
      {open >= 0 && (
        <AttachmentLightbox
          key={items[open].id}
          attachments={items}
          index={open}
          ownerPath={ownerPath}
          onRemove={remove}
        />
      )}
    </>
  );
}
