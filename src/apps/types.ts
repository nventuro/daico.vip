import type { RouteObject } from 'react-router-dom';
import type { TablerIcon } from '@tabler/icons-react';
import type { TableSpec } from '../lib/offline/specs';
import type { EntryMark } from '../types';

/** Every app there is. The one home of the list: the registry is checked
 *  against it, and so is the set of app colours in the theme. */
export const APP_IDS = [
  'tareas',
  'compras',
  'guias',
  'fechas',
  'recetas',
  'documentos',
  'gastos',
  'notas',
] as const;

export type AppId = (typeof APP_IDS)[number];

/** Colour token name (`--color-<hue>` in the theme) an app is painted with:
 *  one per app, named after it, so a new app is a new token and nothing else. */
export type AppHue = `app-${AppId}`;

export function appHue(appId: AppId): AppHue {
  return `app-${appId}`;
}

/** Where an app's own screens hang: under the root, by its id. */
export function appPath(appId: AppId): string {
  return `/${appId}`;
}

/**
 * Where one of an app's entries is: a page of its own under the app's. An
 * entry that hangs off one of the app's screens rather than off the app
 * itself names that screen first — `entryPath('gastos', 'resumenes', id)` —
 * and so does a page of an entry: `entryPath('recetas', id, 'editar')`.
 */
export function entryPath(appId: AppId, ...segments: string[]): string {
  return `/${[appId, ...segments].join('/')}`;
}

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
  marks?: EntryMark[];
}

/**
 * An app's upcoming entries out of what its table hook has read: whatever
 * `toUpcoming` makes of each entry that has one. Undefined while the table is
 * still being read, which is how the home screen tells a list still to come
 * from an empty one.
 */
export function upcomingFrom<Row>(
  { items, loading }: { items: Row[]; loading: boolean },
  toUpcoming: (row: Row) => Upcoming | null,
): Upcoming[] | undefined {
  if (loading) return undefined;
  return items.flatMap((row): Upcoming[] => {
    const upcoming = toUpcoming(row);
    return upcoming ? [upcoming] : [];
  });
}

/** What the shell needs from a feature to mount it: identity, looks, the
 *  offline tables it owns and its screens. */
export interface AppModule {
  id: AppId;
  name: string;
  icon: TablerIcon;
  /** Tables this app owns. Every one must also be in `ALL_SPECS` (test-enforced). */
  specs: TableSpec[];
  /** Relative to `/${id}`. Use `Component:` (not `element:`) so module files
   *  stay plain `.ts`; pages should be `lazy()` so an app's dependencies load
   *  only when it is opened. */
  routes: RouteObject[];
  /** Entries for the home screen's upcoming strip; undefined while the app's
   *  table is still being read, so the strip can hold its place. */
  useUpcoming?: () => Upcoming[] | undefined;
  /** Full-text search over the app's content. */
  search?: (query: string) => Promise<SearchHit[]>;
}
