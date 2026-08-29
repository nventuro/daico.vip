import { useState } from 'react';
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
 * was finished; closing (Escape, the phone's back gesture) only drops the
 * pictures not yet reached.
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
    <ModalDialog onClose={onClose} layout="sheet">
      <div className="flex flex-col gap-4 p-4">
        <span className="font-medium">
          {files.length === 1 ? 'Nueva foto' : `Foto ${index + 1} de ${files.length}`}
        </span>
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
