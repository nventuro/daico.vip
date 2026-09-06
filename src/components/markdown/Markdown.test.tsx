import { describe, it, expect } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { MemoryRouter } from 'react-router-dom';
import Markdown from './Markdown';
import { MARKDOWN_CLASS } from './classes';

const render = (body: string) =>
  renderToStaticMarkup(
    <MemoryRouter>
      <Markdown body={body} />
    </MemoryRouter>,
  );

describe('Markdown', () => {
  it('keeps a path inside the app and sends everything else away from it', () => {
    expect(render('[x](/guias/g/c)')).toContain('href="/guias/g/c"');
    expect(render('[x](/guias/g/c)')).not.toContain('target=');
    // Another origin, however much it reads like a path.
    expect(render('[x](//evil.test)')).toContain(
      '<a href="//evil.test" target="_blank" rel="noopener noreferrer"',
    );
    expect(render('[x](https://ejemplo.test/a "un título")')).toContain('title="un título"');
  });

  it('lets no script through a link', () => {
    expect(render('[x](javascript:alert(1))')).not.toContain('javascript:');
  });

  it('draws a ticked list as boxes that are read, not ticked', () => {
    const html = render('- [ ] a\n- [x] b');
    expect(html).toContain(`<ul class="${MARKDOWN_CLASS.taskList}">`);
    expect(html).toContain(`<li class="${MARKDOWN_CLASS.taskItem.replace(/&/g, '&amp;')}">`);
    expect(html).toContain('<input type="checkbox"');
    expect(html).toContain('<input type="checkbox" tabindex="-1" checked=""');
    expect(html).toContain(`<div><p class="${MARKDOWN_CLASS.p}">a</p></div>`);
  });

  it('draws a heading deeper than the dialect tells apart as the last one it does', () => {
    expect(render('#### h')).toBe(
      `<div class="${MARKDOWN_CLASS.body}"><h3 class="${MARKDOWN_CLASS.h3}">h</h3></div>`,
    );
  });

  it('starts a numbered list where it was started', () => {
    expect(render('3. tres\n4. cuatro')).toContain(`<ol start="3" class="${MARKDOWN_CLASS.ol}">`);
  });

  it('shows an image by address as what was written', () => {
    expect(render('![foto](https://ejemplo.test/a.png)')).toContain(
      `<code class="${MARKDOWN_CLASS.code}">![foto](https://ejemplo.test/a.png)</code>`,
    );
    expect(render('![foto](https://ejemplo.test/a.png)')).not.toContain('<img');
  });

  it('reads a soft break as a space, and keeps the spaces it is given', () => {
    expect(render('línea uno\nlínea dos')).toContain('>línea uno línea dos<');
    expect(render('dos   espacios')).toContain('>dos   espacios<');
  });

  it('draws a video only for something shaped like a video id', () => {
    expect(render('::youtube{id="../x"}')).not.toContain('../x');
    expect(render('::youtube{id="abcdefghijk"}')).toContain('abcdefghijk');
  });
});
