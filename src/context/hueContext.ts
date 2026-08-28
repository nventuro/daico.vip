import { createContext } from 'react';
import type { AppHue } from '../apps/types';

/** The hue of the app whose screen is showing, for anything rendered outside
 *  its frame (a modal at the end of the document) to be painted in it too. */
export const HueContext = createContext<AppHue | 'primary'>('primary');
