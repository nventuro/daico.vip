import { describe, it, expect } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { MemoryRouter } from 'react-router-dom';
import HomePage from './HomePage';
import { apps } from '../apps/registry';
import { appPath } from '../apps/types';

describe('HomePage', () => {
  it('renders one tile per app, in registry order', () => {
    const html = renderToStaticMarkup(
      <MemoryRouter>
        <HomePage />
      </MemoryRouter>,
    );
    const hrefs = [...html.matchAll(/href="([^"]+)"/g)].map((m) => m[1]);
    expect(hrefs).toEqual(apps.map((app) => appPath(app.id)));
    for (const app of apps) expect(html).toContain(app.name);
  });
});
