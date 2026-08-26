/// <reference types="node" />
import { readFileSync } from 'node:fs';
import { describe, it, expect } from 'vitest';
import { apps } from './registry';
import { ALL_SPECS } from '../lib/offline/specs';

describe('apps registry', () => {
  it('has unique ids', () => {
    const ids = apps.map((a) => a.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('gives every app at least one route, all relative', () => {
    for (const app of apps) {
      expect(app.routes.length).toBeGreaterThan(0);
      for (const route of app.routes) {
        if (route.path != null) expect(route.path.startsWith('/')).toBe(false);
      }
    }
  });

  it('owns exactly the offline-synced tables, in sync order', () => {
    const specs = apps.flatMap((a) => a.specs);
    expect(specs).toEqual(ALL_SPECS);
    const tables = specs.map((s) => s.table);
    expect(tables).toEqual(['chores', 'shopping_items', 'guides', 'guide_chapters', 'dates', 'recipes']);
    expect(new Set(tables).size).toBe(tables.length);
  });

  it('has a colour token for every hue', () => {
    const css = readFileSync(new URL('../index.css', import.meta.url), 'utf8');
    for (const app of apps) expect(css).toContain(`--color-${app.hue}:`);
  });
});
