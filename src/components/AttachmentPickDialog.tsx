import { IconFileTypePdf, IconPhoto } from '@tabler/icons-react';
import { PDF_TYPE } from '../lib/attachmentFiles';
import HiddenFileInput from './HiddenFileInput';
import LinkRow from './LinkRow';
import ModalDialog from './ModalDialog';

interface AttachmentPickDialogProps {
  /** The files picked, all pictures or all PDFs; never empty. */
  onPick: (files: File[]) => void;
  /** Called when the question is dismissed, or the device's picker closed
   *  without picking. */
  onClose: () => void;
}

/**
 * The question Agregar asks — pictures, or a PDF — each answer bringing up
 * the device's picker for that kind. Asking for images alone is what brings
 * a phone's photo picker up, which hands over a readable copy of every
 * picture picked; a PDF is asked for through the file chooser on its own,
 * since any other type in the pictures' list would send them there too. The
 * question stays up until the picker answers: the inputs live here, and one
 * gone by the time the device answers would lose the pick.
 */
export default function AttachmentPickDialog({ onPick, onClose }: AttachmentPickDialogProps) {
  return (
    <ModalDialog onClose={onClose} layout="confirm">
      <HiddenFileInput
        accept="image/*"
        multiple
        label="Agregar fotos"
        onPick={onPick}
        onCancel={onClose}
      >
        {(pickPictures) => (
          <HiddenFileInput
            accept={PDF_TYPE}
            multiple
            label="Agregar PDF"
            onPick={onPick}
            onCancel={onClose}
          >
            {(pickPdfs) => (
              <ul className="-my-1 [&>li:last-child]:border-b-0">
                <LinkRow
                  title="Fotos"
                  leading={<IconPhoto size={20} stroke={1.5} className="shrink-0 text-muted" />}
                  onClick={pickPictures}
                />
                <LinkRow
                  title="PDF"
                  leading={
                    <IconFileTypePdf size={20} stroke={1.5} className="shrink-0 text-muted" />
                  }
                  onClick={pickPdfs}
                />
              </ul>
            )}
          </HiddenFileInput>
        )}
      </HiddenFileInput>
    </ModalDialog>
  );
}
