import { useEffect, useState, type FormEvent } from 'react';
import ReactCrop, { type PercentCrop } from 'react-image-crop';
import 'react-image-crop/dist/ReactCrop.css';
import { IconRotate, IconRotateClockwise } from '@tabler/icons-react';
import { attachmentProblem, attachmentType } from '../lib/attachmentFiles';
import { useObjectUrl } from '../hooks/useObjectUrl';
import {
  WHOLE_IMAGE,
  decodeImage,
  isWholeImage,
  renderImage,
  rotateCrop,
  turn,
  type Rotation,
} from '../utils/imageUtils';
import Button from './Button';
import ErrorLine from './ErrorLine';
import FormField from './FormField';
import TextInput from './TextInput';
import LoadingLine from './LoadingLine';

/** JPEG quality a picture is encoded at once it has been cropped or rotated. */
const ATTACHMENT_JPEG_QUALITY = 0.9;

/** Longest side, in pixels, of the copy a picture is cropped on: enough to
 *  place a crop, small enough for a phone to redraw at once on each turn. */
const ATTACHMENT_PREVIEW_MAX_PX = 1600;

const PREVIEW = {
  type: 'image/jpeg',
  quality: ATTACHMENT_JPEG_QUALITY,
  maxSize: ATTACHMENT_PREVIEW_MAX_PX,
};

const CROP_LABELS = {
  cropArea: 'Recorte',
  nwDragHandle: 'Esquina superior izquierda',
  nDragHandle: 'Borde superior',
  neDragHandle: 'Esquina superior derecha',
  eDragHandle: 'Borde derecho',
  seDragHandle: 'Esquina inferior derecha',
  sDragHandle: 'Borde inferior',
  swDragHandle: 'Esquina inferior izquierda',
  wDragHandle: 'Borde izquierdo',
};

interface PictureEditorProps {
  file: File;
  skipLabel: string;
  submitLabel: string;
  /** Stores the picture as edited; false when it could not be. */
  onSave: (file: File, name: string) => Promise<boolean>;
  onSkip: () => void;
}

/**
 * One picked picture on its way to becoming an attachment: turned with the
 * rotate buttons, cut down by dragging the edges of the selection, given an
 * optional name. A picture left as it came is stored byte for byte; an edited
 * one is drawn afresh.
 */
export default function PictureEditor({
  file,
  skipLabel,
  submitLabel,
  onSave,
  onSkip,
}: PictureEditorProps) {
  const refused = attachmentProblem(file);
  const [image, setImage] = useState<ImageBitmap | null>(null);
  const [preview, setPreview] = useState<Blob | null>(null);
  const previewUrl = useObjectUrl(preview);
  const [rotation, setRotation] = useState<Rotation>(0);
  const [crop, setCrop] = useState<PercentCrop>();
  const [name, setName] = useState('');
  const [problem, setProblem] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  // Decoded once and kept for every drawing; the crop is placed on a smaller
  // preview drawn from it, which a phone can redraw at once on each turn.
  useEffect(() => {
    if (refused) return;
    let active = true;
    let decoded: ImageBitmap | null = null;
    (async () => {
      const bitmap = await decodeImage(file);
      if (!active) {
        bitmap.close();
        return;
      }
      decoded = bitmap;
      const blob = await renderImage(bitmap, 0, null, PREVIEW);
      if (!active) return;
      setImage(bitmap);
      setPreview(blob);
    })().catch(() => {
      if (active) setProblem('No se pudo leer la foto.');
    });
    return () => {
      active = false;
      decoded?.close();
    };
  }, [file, refused]);

  async function rotate(quarterTurns: 1 | -1) {
    if (!image || busy) return;
    const next = turn(rotation, quarterTurns);
    setBusy(true);
    try {
      const blob = await renderImage(image, next, null, PREVIEW);
      setRotation(next);
      setCrop((current) => current && rotateCrop(current, quarterTurns));
      setPreview(blob);
    } catch {
      setProblem('No se pudo girar la foto.');
    } finally {
      setBusy(false);
    }
  }

  async function submit(e: FormEvent) {
    e.preventDefault();
    // The entry's own form is an ancestor in the React tree, if not in the
    // document, and must not take this submit for its own.
    e.stopPropagation();
    if (!image || busy) return;
    setBusy(true);
    try {
      const cut = crop && !isWholeImage(crop) ? crop : null;
      let picture = file;
      if (rotation !== 0 || cut) {
        // A photo comes out as JPEG; a PNG stays one, so a screenshot's text keeps its edges.
        const type = attachmentType(file) === 'image/png' ? 'image/png' : 'image/jpeg';
        const blob = await renderImage(image, rotation, cut, {
          type,
          quality: ATTACHMENT_JPEG_QUALITY,
        });
        picture = new File([blob], file.name, { type });
      }
      const tooBig = attachmentProblem(picture);
      if (tooBig) {
        setProblem(tooBig);
        return;
      }
      if (!(await onSave(picture, name))) setProblem('No se pudo guardar la foto.');
    } catch {
      setProblem('No se pudo guardar la foto.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={submit} className="flex flex-col gap-4">
      {/* Padded so the selection's handles, which sit astride the picture's
          edges, have room when the picture fills the stage. */}
      <div className="flex h-[50dvh] items-center justify-center overflow-hidden bg-surface-inverse p-3">
        {previewUrl ? (
          <ReactCrop
            crop={crop}
            onChange={(_, percent) => setCrop(percent)}
            keepSelection
            ariaLabels={CROP_LABELS}
            className="max-h-[calc(50dvh-1.5rem)]"
          >
            <img
              src={previewUrl}
              alt=""
              onLoad={() => setCrop((current) => current ?? WHOLE_IMAGE)}
            />
          </ReactCrop>
        ) : (refused ?? problem) ? (
          <span className="px-4 text-center text-sm text-error">{refused ?? problem}</span>
        ) : (
          <LoadingLine inverse className="w-1/3" />
        )}
      </div>

      <div className="flex items-center justify-between gap-3">
        <span className="text-xs text-muted">Arrastrá los bordes para recortar.</span>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => rotate(-1)}
            disabled={!image || busy}
            aria-label="Girar a la izquierda"
            title="Girar a la izquierda"
          >
            <IconRotate size={18} stroke={1.75} />
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => rotate(1)}
            disabled={!image || busy}
            aria-label="Girar a la derecha"
            title="Girar a la derecha"
          >
            <IconRotateClockwise size={18} stroke={1.75} />
          </Button>
        </div>
      </div>

      <FormField label="Nombre">
        <TextInput
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="opcional"
          aria-label="Nombre"
          autoCapitalize="none"
        />
      </FormField>

      {previewUrl && <ErrorLine problem={problem} />}

      <div className="mt-2 flex items-center justify-between gap-3">
        <Button variant="outline" onClick={onSkip} disabled={busy}>
          {skipLabel}
        </Button>
        <Button type="submit" disabled={!image || busy}>
          {submitLabel}
        </Button>
      </div>
    </form>
  );
}
