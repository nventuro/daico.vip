import { useState } from 'react';
import { attachmentType, isPdf } from '../lib/attachmentFiles';
import ModalDialog from './ModalDialog';
import PdfPreview from './PdfPreview';
import PictureEditor from './PictureEditor';

interface AttachmentAddDialogProps {
  /** The files just picked — pictures or PDFs — taken in order. */
  files: File[];
  /** Stores one file as an attachment; false when it could not be. */
  onSave: (file: File, name: string) => Promise<boolean>;
  /** Called once the last file is dealt with, or when the rest are given up on. */
  onClose: () => void;
}

/**
 * Takes the files picked for an entry one at a time: a picture through the
 * editor, a PDF through its preview. Each is stored the moment it is done,
 * so a batch left halfway keeps what was finished; closing (Escape, the
 * phone's back gesture) only drops the files not yet reached.
 */
export default function AttachmentAddDialog({ files, onSave, onClose }: AttachmentAddDialogProps) {
  const [index, setIndex] = useState(0);
  const last = index === files.length - 1;
  const file = files[index];
  const pdf = isPdf(attachmentType(file) ?? '');
  const kind = pdf ? 'PDF' : 'Foto';

  function next() {
    if (last) onClose();
    else setIndex(index + 1);
  }

  async function save(file: File, name: string) {
    const saved = await onSave(file, name);
    if (saved) next();
    return saved;
  }

  const editorProps = {
    file,
    skipLabel: files.length === 1 ? 'Cancelar' : 'Saltar',
    submitLabel: last ? 'Guardar' : 'Siguiente',
    onSave: save,
    onSkip: next,
  };

  return (
    <ModalDialog onClose={onClose} layout="sheet">
      <div className="flex flex-col gap-4 p-4">
        <span className="font-medium">
          {files.length === 1
            ? pdf
              ? 'Nuevo PDF'
              : 'Nueva foto'
            : `${kind} ${index + 1} de ${files.length}`}
        </span>
        {pdf ? (
          <PdfPreview key={index} {...editorProps} />
        ) : (
          <PictureEditor key={index} {...editorProps} />
        )}
      </div>
    </ModalDialog>
  );
}
