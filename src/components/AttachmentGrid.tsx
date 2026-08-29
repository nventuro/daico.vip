import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { IconPlus } from '@tabler/icons-react';
import type { AttachmentOwner } from '../types';
import { useMasterKey } from '../hooks/useMasterKey';
import { useAttachments } from '../hooks/useAttachments';
import ErrorLine from './ErrorLine';
import HiddenFileInput from './HiddenFileInput';
import AttachmentTile from './AttachmentTile';
import AttachmentAddDialog from './AttachmentAddDialog';
import AttachmentLightbox from './AttachmentLightbox';

interface AttachmentGridProps {
  owner: AttachmentOwner;
  /** The entry's own page, which its attachments' URLs hang under. */
  ownerPath: string;
}

/**
 * An entry's attachments as a grid of tiles, ending in Agregar, which asks
 * the device for pictures — as many as wanted at once — and takes them
 * through the add dialog one by one. A tile opens its picture in the
 * lightbox; the entry's route carries the open one as an optional
 * `:attachmentId`, read here.
 */
export default function AttachmentGrid({ owner, ownerPath }: AttachmentGridProps) {
  const { items, error, add, remove } = useAttachments(owner);
  const masterKey = useMasterKey();
  const { attachmentId } = useParams();
  const [picked, setPicked] = useState<File[] | null>(null);

  async function save(file: File, name: string) {
    if (masterKey.status !== 'unlocked') return false;
    return (await add(file, masterKey.key, name)) !== undefined;
  }

  const open = attachmentId ? items.findIndex((a) => a.id === attachmentId) : -1;

  return (
    <>
      {/* Asking for images alone is what brings a phone's photo picker up, and
          it hands over a readable copy of every picture picked. */}
      <HiddenFileInput accept="image/*" multiple label="Agregar fotos" onPick={setPicked}>
        {(pick) => (
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
              onClick={pick}
              className="flex aspect-square flex-col items-center justify-center gap-0.5 border border-border bg-surface-raised text-muted transition-colors hover:text-muted-strong"
            >
              <IconPlus size={22} stroke={1.75} />
              <span className="text-xs">Agregar</span>
            </button>
          </div>
        )}
      </HiddenFileInput>
      <ErrorLine error={error} />
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
