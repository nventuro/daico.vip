import { useContext, useId } from 'react';
import { HueContext, type Hue } from './hue';
import type { AppHue } from '../apps/types';

/** Edge of one repeat of the band pattern, in px. */
const BAND_REPEAT = 56;

const diamond = (x: number, y: number, r: number) =>
  `M${x} ${y - r} L${x + r} ${y} L${x} ${y + r} L${x - r} ${y} Z`;
const disc = (x: number, y: number, r: number) =>
  `M${x} ${y - r} A${r} ${r} 0 1 0 ${x} ${y + r} A${r} ${r} 0 1 0 ${x} ${y - r} Z`;
const square = (x: number, y: number, half: number) =>
  `M${x - half} ${y - half} H${x + half} V${y + half} H${x - half} Z`;

/** The joints every motif shares: the corner fans, which complete into a
 *  rosette where four tiles meet, and the edge half-diamonds, cut at the
 *  border so two neighbours complete one diamond across the gap — any two
 *  tiles fit together whatever their centres. */
const JOINTS = [
  'M0 0 H30 A30 30 0 0 1 0 30 Z',
  'M100 0 V30 A30 30 0 0 1 70 0 Z',
  'M100 100 H70 A30 30 0 0 1 100 70 Z',
  'M0 100 V70 A30 30 0 0 1 30 100 Z',
  'M43.5 0 L50 6.5 L56.5 0 Z',
  'M100 43.5 L93.5 50 L100 56.5 Z',
  'M56.5 100 L50 93.5 L43.5 100 Z',
  'M0 56.5 L6.5 50 L0 43.5 Z',
];

interface MotifShapes {
  /** The app's own drawing between the joints, in the motif's ink. Solid
   *  shapes only: an outline around the tile's icon and name makes them read
   *  smaller. */
  center: string[];
  /** The charcoal pieces over it. */
  accent: string[];
}

/** Each app's own centre. Tareas keeps the original drawing, which is also
 *  the base the shell's own surfaces use. */
const MOTIFS: Record<AppHue, MotifShapes> = {
  'app-tareas': {
    center: [diamond(50, 50, 24)],
    accent: [diamond(50, 50, 12)],
  },
  'app-compras': {
    center: [
      square(33, 33, 7),
      square(67, 33, 7),
      square(50, 50, 7),
      square(33, 67, 7),
      square(67, 67, 7),
    ],
    accent: [square(50, 50, 4)],
  },
  'app-fechas': {
    center: [
      disc(50, 50, 24),
      disc(26.7, 26.7, 5),
      disc(73.3, 26.7, 5),
      disc(73.3, 73.3, 5),
      disc(26.7, 73.3, 5),
    ],
    accent: [diamond(50, 50, 10)],
  },
  'app-notas': {
    center: ['M38 26 L62 26 L74 38 L74 62 L62 74 L38 74 L26 62 L26 38 Z'],
    accent: [square(50, 50, 8)],
  },
  'app-viajes': {
    center: ['M50 14 L57 43 L86 50 L57 57 L50 86 L43 57 L14 50 L43 43 Z'],
    accent: [disc(50, 50, 7)],
  },
  'app-documentos': {
    center: [square(50, 50, 22)],
    accent: ['M36 36 H64 V64 H36 Z M42 42 V58 H58 V42 Z'],
  },
  'app-gastos': {
    center: [disc(34, 34, 11), disc(66, 34, 11), disc(66, 66, 11), disc(34, 66, 11)],
    accent: [diamond(50, 50, 9)],
  },
  'app-recetas': {
    center: [
      'M34 36 A16 16 0 0 1 66 36 Z',
      'M66 64 A16 16 0 0 1 34 64 Z',
      'M64 66 A16 16 0 0 0 64 34 Z',
      'M36 34 A16 16 0 0 0 36 66 Z',
    ],
    accent: [diamond(50, 50, 10)],
  },
  'app-guias': {
    center: ['M0 8 L8 0 L100 92 L92 100 Z', 'M92 0 L100 8 L8 100 L0 92 Z'],
    accent: [diamond(50, 50, 11)],
  },
};

/** What every surface that is not an app's is drawn with. */
const BASE = MOTIFS['app-tareas'];

function shapesFor(hue: Hue): MotifShapes {
  return hue in MOTIFS ? MOTIFS[hue as AppHue] : BASE;
}

function paths(ds: string[]) {
  return ds.map((d) => <path key={d} d={d} fillRule="evenodd" />);
}

interface MotifProps {
  /** A small repeat across the box (an app's header band) instead of one
   *  motif filling it (a tile). */
  band?: boolean;
  /** Fainter, for a tile that only completes the floor. */
  muted?: boolean;
  /** Whose drawing to use; defaults to the hue of the screen it is on. */
  hue?: Hue;
}

/**
 * The calcáreo motif, drawn in the current text colour over whatever is
 * behind it. Fills its positioned parent. Every app has a drawing of its own
 * around the shared joints; each ink prints flat — group opacity, so shapes
 * of one ink crossing never darken.
 */
export default function Motif({ band = false, muted = false, hue }: MotifProps) {
  const contextHue = useContext(HueContext);
  const { center, accent } = shapesFor(hue ?? contextHue);
  // `useId` may contain characters a `url(#...)` reference can't carry.
  const id = `motif-${useId().replace(/[^a-zA-Z0-9-]/g, '')}`;

  if (band) {
    return (
      <svg aria-hidden className="absolute inset-0 h-full w-full">
        <defs>
          <pattern id={id} width={BAND_REPEAT} height={BAND_REPEAT} patternUnits="userSpaceOnUse">
            <g fill="currentColor" opacity={0.13} transform={`scale(${BAND_REPEAT / 100})`}>
              {paths(JOINTS)}
              {paths(center)}
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
      <g fill="currentColor" opacity={muted ? 0.12 : 0.16}>
        {paths(JOINTS)}
        {paths(center)}
      </g>
      <g fill="var(--color-on-surface)" opacity={muted ? 0.08 : 0.14}>
        {paths(accent)}
      </g>
    </svg>
  );
}
