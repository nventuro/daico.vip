import { useId } from 'react';

/** Edge of one repeat of the band pattern, in px. */
const BAND_REPEAT = 56;

const SHAPES = (
  <>
    <path d="M0 0 H30 A30 30 0 0 1 0 30 Z" />
    <path d="M100 0 V30 A30 30 0 0 1 70 0 Z" />
    <path d="M100 100 H70 A30 30 0 0 1 100 70 Z" />
    <path d="M0 100 V70 A30 30 0 0 1 30 100 Z" />
    <path d="M50 26 L74 50 L50 74 L26 50 Z" />
  </>
);

interface MotifProps {
  /** A small repeat across the box (an app's header band) instead of one
   *  motif filling it (a tile). */
  band?: boolean;
  /** Fainter, for a tile that only completes the floor. */
  muted?: boolean;
}

/**
 * The four-fold calcáreo motif, drawn in the current text colour over whatever
 * is behind it. Fills its positioned parent.
 */
export default function Motif({ band = false, muted = false }: MotifProps) {
  // `useId` may contain characters a `url(#...)` reference can't carry.
  const id = `motif-${useId().replace(/[^a-zA-Z0-9-]/g, '')}`;

  if (band) {
    return (
      <svg aria-hidden className="absolute inset-0 h-full w-full">
        <defs>
          <pattern id={id} width={BAND_REPEAT} height={BAND_REPEAT} patternUnits="userSpaceOnUse">
            <g fill="currentColor" fillOpacity={0.13} transform={`scale(${BAND_REPEAT / 100})`}>
              {SHAPES}
            </g>
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill={`url(#${id})`} />
      </svg>
    );
  }

  return (
    <svg
      aria-hidden
      viewBox="0 0 100 100"
      preserveAspectRatio="none"
      className="absolute inset-0 h-full w-full"
    >
      <g fill="currentColor" fillOpacity={muted ? 0.12 : 0.16}>
        {SHAPES}
        <path d="M50 2 L55 7 L50 12 L45 7 Z" />
        <path d="M98 50 L93 55 L88 50 L93 45 Z" />
        <path d="M50 98 L45 93 L50 88 L55 93 Z" />
        <path d="M2 50 L7 45 L12 50 L7 55 Z" />
      </g>
      <path
        d="M50 38 L62 50 L50 62 L38 50 Z"
        fill="var(--color-on-surface)"
        fillOpacity={muted ? 0.08 : 0.14}
      />
    </svg>
  );
}
