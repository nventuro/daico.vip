import { useState, type ChangeEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { IconPlus } from '@tabler/icons-react';
import { ATTACHMENT_FILE_TYPES } from '../../types';
import { useMasterKey } from '../../hooks/useMasterKey';
import AttachmentTile from './AttachmentTile';
import { attachmentProblem, useAttachments } from './useAttachments';

const ACCEPT = Object.keys(ATTACHMENT_FILE_TYPES).join(',');

/**
 * A chore's attachments as a grid of tiles, ending in Agregar, which opens the
 * device's own picker (camera, files, cloud drives alike) and then the screen
 * that names the picked file.
 */
export default function AttachmentGrid({ choreId }: { choreId: string }) {
  const { items, add } = useAttachments(choreId);
  const masterKey = useMasterKey();
  const navigate = useNavigate();
  const [problem, setProblem] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function pick(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    // Cleared so picking the same file again still counts as a change.
    e.target.value = '';
    if (!file || busy) return;
    const refused = attachmentProblem(file);
    setProblem(refused);
    if (refused || masterKey.status !== 'unlocked') return;
    // Store it now; the next screen only gives it a name.
    setBusy(true);
    const id = await add(choreId, file, masterKey.key);
    setBusy(false);
    if (id) navigate(`/tareas/${choreId}/nuevo/${id}`);
  }

  return (
    <>
      <div className="mt-0.5 grid grid-cols-3 gap-2">
        {items.map((attachment) => (
          <AttachmentTile
            key={attachment.id}
            attachment={attachment}
            to={`/tareas/${choreId}/${attachment.id}`}
          />
        ))}
        <label className="flex min-w-0 cursor-pointer flex-col gap-1">
          <span className="flex aspect-square flex-col items-center justify-center gap-0.5 border border-border bg-surface-raised text-muted transition-colors hover:text-muted-strong">
            <IconPlus size={22} stroke={1.75} />
            <span className="text-xs">Agregar</span>
          </span>
          <input
            type="file"
            accept={ACCEPT}
            onChange={pick}
            disabled={busy}
            aria-label="Agregar adjunto"
            className="sr-only"
          />
        </label>
      </div>
      {problem && <p className="text-sm text-error">{problem}</p>}
    </>
  );
}
