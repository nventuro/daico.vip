import { useEffect, useState } from 'react';
import { guideImageUrl } from '../../lib/guideImages';
import LoadingLine from '../../components/LoadingLine';
import Motif from '../../components/Motif';

interface Props {
  imageKey: string;
  /** Percentage of the text column the image should take. */
  width: number;
  align: 'left' | 'center' | 'right';
}

const JUSTIFY = { left: 'justify-start', center: 'justify-center', right: 'justify-end' } as const;

/**
 * An image referenced from a chapter body, resolved through the local cache.
 * Until it is, a placeholder of the width it will take keeps the text where it
 * is. Mount with `key={imageKey}` so a different image gets a fresh instance.
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
        <img src={src} alt="" className="h-auto max-w-full" style={{ width: `${width}%` }} />
      ) : (
        <span
          className="relative block aspect-video overflow-hidden border border-border bg-surface-raised text-muted"
          style={{ width: `${width}%` }}
        >
          <Motif band />
          {src === null ? (
            <span className="absolute inset-0 flex items-center justify-center px-3 text-center text-sm">
              Imagen no disponible sin conexión
            </span>
          ) : (
            <LoadingLine className="absolute inset-x-0 bottom-0" />
          )}
        </span>
      )}
    </figure>
  );
}
