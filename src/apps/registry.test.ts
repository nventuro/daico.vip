/// <reference types="node" />
import { readFileSync } from 'node:fs';
import { describe, it, expect } from 'vitest';
import { apps } from './registry';
import { APP_IDS, appHue, appPath, entryPath } from './types';
import { ALL_SPECS, SHELL_SPECS } from '../lib/offline/specs';

describe('apps registry', () => {
  it('mounts every app there is, once', () => {
    const ids = apps.map((a) => a.id);
    expect([...ids].sort()).toEqual([...APP_IDS].sort());
  });

  it('gives every app a name of its own and an icon', () => {
    const names = apps.map((a) => a.name);
    expect(new Set(names).size).toBe(names.length);
    for (const app of apps) expect(app.icon).toBeTruthy();
  });

  it('gives every app at least one route, all relative and lazily loaded', () => {
    for (const app of apps) {
      expect(app.routes.length).toBeGreaterThan(0);
      for (const route of app.routes) {
        if (route.path != null) expect(route.path.startsWith('/')).toBe(false);
        // `lazy()` at module scope: opening one app must not load the others.
        const component = route.Component as unknown as { $$typeof?: symbol };
        expect(component?.$$typeof).toBe(Symbol.for('react.lazy'));
      }
    }
  });

  it('hands out the paths the shell mounts it at', () => {
    for (const app of apps) {
      expect(appPath(app.id)).toBe(`/${app.id}`);
      expect(entryPath(app.id, 'an-id')).toBe(`/${app.id}/an-id`);
      // An entry that hangs off one of the app's screens, or a page of an
      // entry, is built the same way rather than pasted together.
      expect(entryPath(app.id, 'under', 'an-id')).toBe(`/${app.id}/under/an-id`);
    }
  });

  it('owns exactly the offline-synced tables, in sync order', () => {
    const specs = [...SHELL_SPECS, ...apps.flatMap((a) => a.specs)];
    expect(specs).toEqual(ALL_SPECS);
    const tables = specs.map((s) => s.table);
    expect(tables).toEqual([
      'household_key',
      'attachments',
      'chores',
      'shopping_items',
      'dates',
      'notes',
      'ideas',
      'trips',
      'trip_items',
      'trip_inbox',
      'documents',
      'statements',
      'merchant_rules',
      'recipes',
      'guides',
      'guide_chapters',
    ]);
    expect(new Set(tables).size).toBe(tables.length);
  });

  it('has a colour token for every app and for nothing else', () => {
    const css = readFileSync(new URL('../index.css', import.meta.url), 'utf8');
    const declared = [...css.matchAll(/--color-(app-[a-z]+):/g)].map((match) => match[1]);
    expect([...declared].sort()).toEqual(apps.map((app) => appHue(app.id)).sort());
  });
});
