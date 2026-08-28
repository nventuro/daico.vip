import { useState } from 'react';
import { IconX } from '@tabler/icons-react';
import ModalDialog from './ModalDialog';
import PictureEditor from './PictureEditor';

interface AttachmentAddDialogProps {
  /** The pictures just picked, taken in order. */
  files: File[];
  /** Stores one picture as an attachment; false when it could not be. */
  onSave: (file: File, name: string) => Promise<boolean>;
  /** Called once the last picture is dealt with, or when the rest are given up on. */
  onClose: () => void;
}

/**
 * Takes the pictures picked for an entry one at a time through the editor.
 * Each is stored the moment it is done, so a batch left halfway keeps what
 * was finished; closing (the ×, Escape, the phone's back gesture) only drops
 * the pictures not yet reached.
 */
export default function AttachmentAddDialog({ files, onSave, onClose }: AttachmentAddDialogProps) {
  const [index, setIndex] = useState(0);
  const last = index === files.length - 1;

  function next() {
    if (last) onClose();
    else setIndex(index + 1);
  }

  async function save(file: File, name: string) {
    const saved = await onSave(file, name);
    if (saved) next();
    return saved;
  }

  return (
    <ModalDialog
      onClose={onClose}
      className="fixed inset-0 m-0 h-dvh max-h-none w-screen max-w-none overflow-y-auto bg-surface p-0 text-on-surface backdrop:bg-on-surface/50 sm:m-auto sm:h-auto sm:max-h-[90dvh] sm:w-full sm:max-w-lg sm:border sm:border-border"
    >
      <div className="flex flex-col gap-4 p-4">
        <div className="flex items-center justify-between">
          <span className="font-medium">
            {files.length === 1 ? 'Nueva foto' : `Foto ${index + 1} de ${files.length}`}
          </span>
          <button
            type="button"
            onClick={onClose}
            aria-label="Cancelar"
            title="Cancelar"
            className="-mr-2 flex items-center p-2 text-muted transition-colors hover:text-muted-strong"
          >
            <IconX size={20} stroke={1.75} />
          </button>
        </div>
        <PictureEditor
          key={index}
          file={files[index]}
          skipLabel={files.length === 1 ? 'Cancelar' : 'Saltar'}
          submitLabel={last ? 'Guardar' : 'Siguiente'}
          onSave={save}
          onSkip={next}
        />
      </div>
    </ModalDialog>
  );
}
