import { useEffect, useState } from 'react';
import { guideImageUrl } from '../../lib/guideImages';

interface Props {
  imageKey: string;
  /** Percentage of the text column the image should take. */
  width: number;
  align: 'left' | 'center' | 'right';
}

const JUSTIFY = { left: 'justify-start', center: 'justify-center', right: 'justify-end' } as const;

/**
 * An image referenced from a chapter body, resolved through the local cache.
 * Mount with `key={imageKey}` so a different image gets a fresh instance.
 */
export default function GuideImage({ imageKey, width, align }: Props) {
  // undefined while resolving, null when unavailable (offline and never fetched).
  const [src, setSrc] = useState<string | null | undefined>(undefined);

  useEffect(() => {
    let active = true;
    guideImageUrl(imageKey).then((url) => {
      if (active) setSrc(url);
    });
    return () => {
      active = false;
    };
  }, [imageKey]);

  return (
    <figure className={`my-4 flex ${JUSTIFY[align] ?? JUSTIFY.center}`}>
      {src ? (
        <img
          src={src}
          alt=""
          className="h-auto max-w-full rounded-lg"
          style={{ width: `${width}%` }}
        />
      ) : (
        <span className="rounded-lg bg-border-subtle px-3 py-2 text-sm text-muted">
          {src === null ? 'Imagen no disponible sin conexión' : 'Cargando imagen...'}
        </span>
      )}
    </figure>
  );
}
