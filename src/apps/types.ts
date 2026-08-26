import type { RouteObject } from 'react-router-dom';
import type { TablerIcon } from '@tabler/icons-react';
import type { TableSpec } from '../lib/offline/specs';

export type AppId = 'tareas' | 'compras' | 'guias';

/** Colour token name (`--color-<hue>` in the theme) an app is painted with. */
export type AppHue =
  | 'app-tareas'
  | 'app-compras'
  | 'app-guias'
  | 'app-recetas'
  | 'app-viajes'
  | 'app-fechas'
  | 'app-papeles';

/** One result of an app's `search`. */
export interface SearchHit {
  title: string;
  subtitle?: string;
  to: string;
}

/** A dated entry an app surfaces on the home screen. */
export interface Upcoming {
  title: string;
  /** yyyy-mm-dd */
  on: string;
  to: string;
  appId: AppId;
}

/** What the shell needs from a feature to mount it: identity, looks, the
 *  offline tables it owns and its screens. */
export interface AppModule {
  id: AppId;
  name: string;
  hue: AppHue;
  icon: TablerIcon;
  /** Tables this app owns. Every one must also be in `ALL_SPECS` (test-enforced). */
  specs: TableSpec[];
  /** Relative to `/${id}`. Use `Component:` (not `element:`) so module files
   *  stay plain `.ts`; pages should be `lazy()` so an app's dependencies load
   *  only when it is opened. */
  routes: RouteObject[];
  /** Short line shown under the app's tile, or null for nothing. */
  useStatus?: () => string | null;
  /** Entries for the home screen's upcoming strip. */
  useUpcoming?: () => Upcoming[];
  /** Full-text search over the app's content. */
  search?: (query: string) => Promise<SearchHit[]>;
}
