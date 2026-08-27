import { useRef, useState, type ChangeEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  IconCamera,
  IconFileText,
  IconPhoto,
  IconPlus,
  type TablerIcon,
} from '@tabler/icons-react';
import { ATTACHMENT_FILE_TYPES, type AttachmentOwner } from '../types';
import { useMasterKey } from '../hooks/useMasterKey';
import { attachmentProblem, useAttachments } from '../hooks/useAttachments';
import AttachmentTile from './AttachmentTile';
import Button from './Button';

const ON_ANDROID = /Android/i.test(navigator.userAgent);

/** One way of getting a file: what the device is asked for and the button that asks. */
interface Source {
  label: string;
  accept: string;
  capture?: 'environment';
  Icon: TablerIcon;
}

// On Android, pictures and documents are asked for separately. An `accept` of
// images alone is what brings up the system photo picker, which hands over a
// readable copy of the picture wherever it lives; any other type in the list
// turns the request into the generic Files chooser, whose picks Chrome can
// drop before the page hears of them. `capture` goes straight to the camera.
// Anywhere else one file dialog takes everything.
const SOURCES: Source[] = ON_ANDROID
  ? [
      { label: 'Cámara', accept: 'image/*', capture: 'environment', Icon: IconCamera },
      { label: 'Fotos', accept: 'image/*', Icon: IconPhoto },
      {
        label: 'PDF',
        accept: Object.keys(ATTACHMENT_FILE_TYPES)
          .filter((type) => !type.startsWith('image/'))
          .join(','),
        Icon: IconFileText,
      },
    ]
  : [{ label: 'Archivo', accept: Object.keys(ATTACHMENT_FILE_TYPES).join(','), Icon: IconPlus }];

interface AttachmentGridProps {
  owner: AttachmentOwner;
  /** The entry's own page, which its attachments' screens hang under. */
  ownerPath: string;
}

/**
 * An entry's attachments as a grid of tiles, ending in Agregar, which asks
 * the device for a file — on a phone, after choosing between the camera, the
 * photos and a PDF — and then opens the screen that names the picked file.
 */
export default function AttachmentGrid({ owner, ownerPath }: AttachmentGridProps) {
  const { items, error, add } = useAttachments(owner);
  const masterKey = useMasterKey();
  const navigate = useNavigate();
  const inputs = useRef<(HTMLInputElement | null)[]>([]);
  const [choosing, setChoosing] = useState(false);
  const [problem, setProblem] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  function open(index: number) {
    inputs.current[index]?.click();
  }

  async function pick(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    // Cleared so picking the same file again still counts as a change.
    e.target.value = '';
    if (!file || busy) return;
    setChoosing(false);
    const refused = attachmentProblem(file);
    setProblem(refused);
    if (refused || masterKey.status !== 'unlocked') return;
    // Store it now; the next screen only gives it a name.
    setBusy(true);
    const id = await add(file, masterKey.key);
    setBusy(false);
    if (id) navigate(`${ownerPath}/nuevo/${id}`);
  }

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
          onClick={() => (SOURCES.length === 1 ? open(0) : setChoosing((c) => !c))}
          disabled={busy}
          aria-expanded={SOURCES.length > 1 ? choosing : undefined}
          className="flex aspect-square flex-col items-center justify-center gap-0.5 border border-border bg-surface-raised text-muted transition-colors hover:text-muted-strong disabled:cursor-not-allowed"
        >
          <IconPlus size={22} stroke={1.75} />
          <span className="text-xs">Agregar</span>
        </button>
      </div>
      {choosing && (
        <div className="flex flex-wrap gap-2">
          {SOURCES.map(({ label, Icon }, index) => (
            <Button
              key={label}
              variant="outline"
              size="sm"
              disabled={busy}
              onClick={() => open(index)}
              className="flex items-center gap-1.5"
            >
              <Icon size={16} stroke={1.5} />
              {label}
            </Button>
          ))}
        </div>
      )}
      {/* The buttons are the visible controls; these inputs only carry the device's pickers. */}
      {SOURCES.map(({ label, accept, capture }, index) => (
        <input
          key={label}
          ref={(el) => {
            inputs.current[index] = el;
          }}
          type="file"
          accept={accept}
          capture={capture}
          onChange={pick}
          aria-label={`Agregar adjunto: ${label}`}
          tabIndex={-1}
          className="sr-only"
        />
      ))}
      {problem && <p className="text-sm text-error">{problem}</p>}
      {error && <p className="text-sm text-error">Error: {error}</p>}
    </>
  );
}
