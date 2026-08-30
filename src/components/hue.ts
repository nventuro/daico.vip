import { createContext, type CSSProperties } from 'react';
import type { AppHue } from '../apps/types';

/** What one of the shell's own screens is painted with: the shell's colour, or
 *  — for Próximo, which shows the apps' entries rather than being a tool — one
 *  of its own. */
export type ShellHue = 'primary' | 'proximo';

/** Every colour a screen can be painted in. */
export type Hue = AppHue | ShellHue;

/** The hue of the app whose screen is showing, for anything rendered outside
 *  its frame (a modal at the end of the document) to be painted in it too. */
export const HueContext = createContext<Hue>('primary');

/** Inline style that sets the `--app` custom property the hue-aware utilities
 *  (`bg-(--app)`, `text-(--app)`) read, so a subtree is painted in one app's
 *  colour. `'primary'` paints it in the shell's own colour. */
export function hueStyle(hue: Hue): CSSProperties {
  // Custom properties are not part of CSSProperties, hence the cast.
  return {
    '--app': hue === 'primary' ? 'var(--color-primary)' : `var(--color-${hue})`,
  } as CSSProperties;
}
