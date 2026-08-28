import type { PercentCrop } from 'react-image-crop';

/** How far a picture has been turned clockwise, in degrees. */
export type Rotation = 0 | 90 | 180 | 270;

/** The selection that leaves a picture whole. */
export const WHOLE_IMAGE: PercentCrop = { unit: '%', x: 0, y: 0, width: 100, height: 100 };

// A selection dragged back out to the edges lands a hair short of them.
const WHOLE_IMAGE_TOLERANCE = 0.1;

/** Whether `crop` keeps the whole picture, i.e. saving it would crop nothing. */
export function isWholeImage(crop: PercentCrop): boolean {
  return (
    crop.x <= WHOLE_IMAGE_TOLERANCE &&
    crop.y <= WHOLE_IMAGE_TOLERANCE &&
    crop.width >= 100 - WHOLE_IMAGE_TOLERANCE &&
    crop.height >= 100 - WHOLE_IMAGE_TOLERANCE
  );
}

/** `rotation` after a quarter turn clockwise (`1`) or counter-clockwise (`-1`). */
export function turn(rotation: Rotation, quarterTurns: 1 | -1): Rotation {
  return ((rotation + 90 * quarterTurns + 360) % 360) as Rotation;
}

/** Where `crop` lies once the picture under it has made a quarter turn
 *  clockwise (`1`) or counter-clockwise (`-1`): the selection follows the
 *  picture around. */
export function rotateCrop(crop: PercentCrop, quarterTurns: 1 | -1): PercentCrop {
  const { x, y, width, height } = crop;
  return quarterTurns === 1
    ? { unit: '%', x: 100 - y - height, y: x, width: height, height: width }
    : { unit: '%', x: y, y: 100 - x - width, width: height, height: width };
}

/** The picture in `file` decoded the way it is meant to be seen: a phone's
 *  photo is often stored sideways with a note on which way is up, and the
 *  note is applied here so every later drawing starts upright. */
export function decodeImage(file: File): Promise<ImageBitmap> {
  return createImageBitmap(file, { imageOrientation: 'from-image' });
}

interface RenderOptions {
  /** The MIME type to encode as (`image/jpeg`, `image/png`). */
  type: string;
  /** Encoder quality, 0–1, where the type takes one. */
  quality?: number;
  /** Cap on the longest side, in pixels; the picture is scaled down to fit. */
  maxSize?: number;
}

/**
 * `image` turned by `rotation` and cut down to `crop` (the whole picture when
 * null), encoded as a new file. Rotation and crop happen in one drawing, so a
 * large photo is never held twice.
 */
export function renderImage(
  image: ImageBitmap,
  rotation: Rotation,
  crop: PercentCrop | null,
  { type, quality, maxSize }: RenderOptions,
): Promise<Blob> {
  const sideways = rotation === 90 || rotation === 270;
  const width = sideways ? image.height : image.width;
  const height = sideways ? image.width : image.height;
  const region = crop
    ? {
        x: (crop.x / 100) * width,
        y: (crop.y / 100) * height,
        width: (crop.width / 100) * width,
        height: (crop.height / 100) * height,
      }
    : { x: 0, y: 0, width, height };
  const scale = maxSize ? Math.min(1, maxSize / Math.max(region.width, region.height)) : 1;

  const canvas = document.createElement('canvas');
  canvas.width = Math.max(1, Math.round(region.width * scale));
  canvas.height = Math.max(1, Math.round(region.height * scale));
  const ctx = canvas.getContext('2d');
  if (!ctx) return Promise.reject(new Error('No canvas context'));

  ctx.scale(scale, scale);
  ctx.translate(-region.x, -region.y);
  // Turn about the origin, then shift the picture back into the turned frame:
  // the corner that the turn swung out of view is the one brought to (0, 0).
  if (rotation === 90) ctx.translate(width, 0);
  else if (rotation === 180) ctx.translate(width, height);
  else if (rotation === 270) ctx.translate(0, height);
  ctx.rotate((rotation * Math.PI) / 180);
  ctx.drawImage(image, 0, 0);

  return new Promise((resolve, reject) =>
    canvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error('Could not encode the picture'))),
      type,
      quality,
    ),
  );
}
