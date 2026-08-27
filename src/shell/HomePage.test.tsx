import { describe, it, expect } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { MemoryRouter } from 'react-router-dom';
import HomePage from './HomePage';

describe('HomePage', () => {
  it('renders one tile per app, in registry order', () => {
    const html = renderToStaticMarkup(
      <MemoryRouter>
        <HomePage />
      </MemoryRouter>,
    );
    const hrefs = [...html.matchAll(/href="([^"]+)"/g)].map((m) => m[1]);
    expect(hrefs).toEqual(['/tareas', '/compras', '/guias', '/fechas', '/recetas', '/documentos']);
    expect(html).toContain('Tareas');
    expect(html).toContain('Compras');
    expect(html).toContain('Guías');
    expect(html).toContain('Fechas');
    expect(html).toContain('Recetas');
    expect(html).toContain('Documentos');
  });
});
