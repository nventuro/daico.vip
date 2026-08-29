import { describe, it, expect } from 'vitest';
import { matchRoutes, type RouteObject } from 'react-router-dom';
import { apps } from '../apps/registry';
import { parentPath } from './parentPath';

describe('parentPath', () => {
  it('drops the last segment', () => {
    expect(parentPath('/guias/a/b')).toBe('/guias/a');
    expect(parentPath('/guias')).toBe('/');
  });

  it('keeps the root at the root', () => {
    expect(parentPath('/')).toBe('/');
  });

  it('ignores a trailing slash', () => {
    expect(parentPath('/guias/')).toBe('/');
  });
});

describe('the way back out of every screen', () => {
  const routes: RouteObject[] = apps.map((app) => ({ path: app.id, children: [...app.routes] }));

  /** Every screen the shell mounts, as a pathname with its parameters filled. */
  const screens = apps.flatMap((app) =>
    app.routes.map((route) =>
      `/${[app.id, (route.path ?? '').replace(/:[^/]+/g, 'x')].filter(Boolean).join('/')}`.replace(
        /\/$/,
        '',
      ),
    ),
  );

  it('mounts every screen it lists', () => {
    for (const screen of screens) expect(matchRoutes(routes, screen), screen).toBeTruthy();
  });

  // The back arrow drops one segment, so a screen two segments deep has to
  // sit under one that is really there.
  it('leads back to a screen that exists', () => {
    for (const screen of screens) {
      const parent = parentPath(screen);
      expect(parent === '/' || Boolean(matchRoutes(routes, parent)), `${screen} → ${parent}`).toBe(
        true,
      );
    }
  });
});
