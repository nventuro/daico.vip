import { describe, it, expect } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { MemoryRouter } from 'react-router-dom';
import AppHeader from './AppHeader';

const render = (pathname: string, name: string) =>
  renderToStaticMarkup(
    <MemoryRouter initialEntries={[pathname]}>
      <AppHeader name={name} />
    </MemoryRouter>,
  );

describe('AppHeader', () => {
  it('links one level up and shows the app name', () => {
    const html = render('/guias/g1/c2', 'Guías');
    expect(html).toContain('href="/guias/g1"');
    expect(html).toContain('Guías');
    expect(html).toContain('aria-label="Volver"');
  });

  it('links to the home screen from an app root', () => {
    expect(render('/tareas', 'Tareas')).toContain('href="/"');
  });
});
