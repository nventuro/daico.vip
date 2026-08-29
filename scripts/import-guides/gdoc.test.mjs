import { describe, it, expect } from 'vitest';
import { gdocHtmlToMarkdown } from './gdoc.mjs';

const doc = (style, body) =>
  `<html><head><style>${style}</style></head><body>${body}</body></html>`;

describe('gdocHtmlToMarkdown', () => {
  it('turns a paragraph document into headings, dividers and list items', () => {
    const html = doc(
      '.c1{font-weight:700}.c2{font-weight:400}',
      [
        '<p class="c3"><span class="c1">Matchup </span><span class="c1">A</span></p>',
        '<p class="c3"><span class="c2">Card X: +2</span></p>',
        '<p class="c3"><span class="c2">---------</span></p>',
        '<p class="c3"><span class="c2">Card Y: -2</span></p>',
        '<p class="c4"><span class="c2"></span></p>',
        '<p class="c3"><span class="c2">Link: </span><a href="https://www.google.com/url?q=https://e.test/l&amp;sa=D">list</a></p>',
      ].join(''),
    );
    expect(gdocHtmlToMarkdown(html)).toBe(
      '### Matchup A\n\n- Card X: +2\n\n---\n\n- Card Y: -2\n\n- Link: [list](https://e.test/l)\n',
    );
  });

  it('turns a table document into a GFM table', () => {
    const html = doc(
      '',
      '<table><tr><td><p><span>Matchup</span></p></td><td><p><span>Plan</span></p></td></tr><tr><td><p><span>A</span></p></td><td><p><span>Go | fast</span></p><p><span>then slow</span></p></td></tr></table>',
    );
    expect(gdocHtmlToMarkdown(html)).toBe(
      '| Matchup | Plan |\n| --- | --- |\n| A | Go \\| fast then slow |\n',
    );
  });
});
