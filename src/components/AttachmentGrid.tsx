import { useRef, useState, type ChangeEvent } from 'react';
import { useParams } from 'react-router-dom';
import { IconPlus } from '@tabler/icons-react';
import type { AttachmentOwner } from '../types';
import { useMasterKey } from '../hooks/useMasterKey';
import { useAttachments } from '../hooks/useAttachments';
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
  const input = useRef<HTMLInputElement>(null);
  const [picked, setPicked] = useState<File[] | null>(null);

  function pick(e: ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []);
    // Cleared so picking the same pictures again still counts as a change.
    e.target.value = '';
    if (files.length > 0) setPicked(files);
  }

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
          onClick={() => input.current?.click()}
          className="flex aspect-square flex-col items-center justify-center gap-0.5 border border-border bg-surface-raised text-muted transition-colors hover:text-muted-strong"
        >
          <IconPlus size={22} stroke={1.75} />
          <span className="text-xs">Agregar</span>
        </button>
      </div>
      {/* The button is the visible control; this input only carries the device's
          photo picker. Asking for images alone is what brings that picker up on
          a phone, and it hands over a readable copy of every picture picked. */}
      <input
        ref={input}
        type="file"
        accept="image/*"
        multiple
        onChange={pick}
        aria-label="Agregar fotos"
        tabIndex={-1}
        className="sr-only"
      />
      {error && <p className="text-sm text-error">Error: {error}</p>}
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
