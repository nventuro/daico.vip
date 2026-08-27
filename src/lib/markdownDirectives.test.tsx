import { describe, it, expect } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import ReactMarkdown, { type Components } from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkDirective from 'remark-directive';
import { directivesToElements } from './markdownDirectives';

// Stub components that echo their props, to prove directives reach the
// renderer as elements with the expected props.
const components = {
  image: (p: { imageKey: string; width: string; align: string }) => (
    <i>{`img:${p.imageKey}:${p.width}:${p.align}`}</i>
  ),
  youtube: (p: { id: string; start: string }) => <i>{`yt:${p.id}:${p.start}`}</i>,
  spoiler: (p: { children?: React.ReactNode }) => <b>{p.children}</b>,
  ingredients: (p: { items: string }) => <i>{`ing:${p.items.split('\n').join('|')}`}</i>,
} as unknown as Components;

const render = (md: string) =>
  renderToStaticMarkup(
    <ReactMarkdown
      remarkPlugins={[remarkGfm, remarkDirective, directivesToElements]}
      components={components}
    >
      {md}
    </ReactMarkdown>,
  );

describe('directivesToElements', () => {
  it('renders leaf directives as block components with their attributes', () => {
    expect(render('Before\n\n::image{key="k1" width="60" align="right"}\n\nAfter')).toBe(
      '<p>Before</p>\n<i>img:k1:60:right</i>\n<p>After</p>',
    );
    expect(render('::youtube{id="abc" start="45"}')).toBe('<i>yt:abc:45</i>');
  });

  it('renders text directives inline within a paragraph', () => {
    expect(render('Hand: :spoiler[Keep **now**]')).toBe(
      '<p>Hand: <b>Keep <strong>now</strong></b></p>',
    );
  });

  it('keeps GFM tables and relative links intact', () => {
    expect(render('| a | b |\n| --- | --- |\n| 1 | 2 |')).toContain('<table>');
    expect(render('[x](/guias/1/2)')).toBe('<p><a href="/guias/1/2">x</a></p>');
  });

  it('flattens an ingredients block to one plain-text item per list entry', () => {
    expect(
      render(
        'Intro\n\n:::ingredients\n- 200 g de harina\n- 2 huevos **grandes**\n- `sal`\n:::\n\nPaso 1',
      ),
    ).toBe('<p>Intro</p>\n<i>ing:200 g de harina|2 huevos grandes|sal</i>\n<p>Paso 1</p>');
  });

  it('accepts ordered lists and ignores the directive label', () => {
    expect(render(':::ingredients[Masa]\n1. a\n2. b\n:::')).toBe('<i>ing:a|b</i>');
  });

  it('yields no items for an ingredients block without a list', () => {
    expect(render(':::ingredients\nsolo texto\n:::')).toBe('<i>ing:</i>');
  });

  it('collapses a multi-line item to one line', () => {
    expect(render(':::ingredients\n- una\n  cosa\n:::')).toBe('<i>ing:una cosa</i>');
  });
});
