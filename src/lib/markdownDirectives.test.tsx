import { describe, it, expect } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import ReactMarkdown, { type Components } from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkDirective from 'remark-directive';
import { directivesToElements } from './markdownDirectives';

// Stub components that echo their props, to prove directives reach the
// renderer as elements with the expected props.
const components = {
  image: (p: { imageKey: string; width: string; align: string }) => <i>{`img:${p.imageKey}:${p.width}:${p.align}`}</i>,
  youtube: (p: { id: string; start: string }) => <i>{`yt:${p.id}:${p.start}`}</i>,
  spoiler: (p: { children?: React.ReactNode }) => <b>{p.children}</b>,
} as unknown as Components;

const render = (md: string) =>
  renderToStaticMarkup(
    <ReactMarkdown remarkPlugins={[remarkGfm, remarkDirective, directivesToElements]} components={components}>
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
    expect(render('Hand: :spoiler[Keep **now**]')).toBe('<p>Hand: <b>Keep <strong>now</strong></b></p>');
  });

  it('keeps GFM tables and relative links intact', () => {
    expect(render('| a | b |\n| --- | --- |\n| 1 | 2 |')).toContain('<table>');
    expect(render('[x](/guias/1/2)')).toBe('<p><a href="/guias/1/2">x</a></p>');
  });
});
