import { describe, it, expect } from 'vitest';
import { normalizeBody } from './normalize.mjs';

const ctx = {
  imageKey: (ref) => (ref === 'missing' ? null : ref.startsWith('http') ? 'ext-1' : ref),
  guideRoute: (id) => (id === 'g1' ? { path: '/guias/G1', title: 'Guide One' } : null),
  linkRoute: (url) =>
    url.includes('docs.google.com/document/d/D1')
      ? { path: '/guias/G1/C9', title: 'Doc One' }
      : null,
  warn: () => {},
};

describe('normalizeBody', () => {
  it('separates line-per-block text into paragraphs but keeps lists contiguous', () => {
    const md = normalizeBody('First line\nSecond line\n- a\n    - a1\n- b\nAfter', ctx);
    expect(md).toBe('First line\n\nSecond line\n\n- a\n    - a1\n- b\n\nAfter\n');
  });

  it('converts both image token forms into image directives on their own line', () => {
    expect(normalizeBody('{{image:abc:large}}', ctx)).toBe(
      '::image{key="abc" width="100" align="center"}\n',
    );
    expect(normalizeBody('{{image:abc:small}}', ctx)).toBe(
      '::image{key="abc" width="50" align="center"}\n',
    );
    expect(normalizeBody('{{image-v2:abc:60:right}}', ctx)).toBe(
      '::image{key="abc" width="60" align="right"}\n',
    );
    expect(normalizeBody('{{image-v2:https://x.test/a.webp:100:center}}', ctx)).toBe(
      '::image{key="ext-1" width="100" align="center"}\n',
    );
    expect(normalizeBody('{{image-v2:abc:100:center:spoiled}}', ctx)).toContain('spoiled="true"');
  });

  it('splits text glued to a token and around (br-line)', () => {
    const md = normalizeBody(
      '{{image:abc:large}}(br-line)Then text[spoiler:hidden]\n(br-line)\nx(br-line)y',
      ctx,
    );
    expect(md).toBe(
      '::image{key="abc" width="100" align="center"}\n\nThen text:spoiler[hidden]\n\nx\n\ny\n',
    );
  });

  it('converts video, guide embeds and document embeds', () => {
    expect(normalizeBody('(youtube)(vid123)(45)', ctx)).toBe('::youtube{id="vid123" start="45"}\n');
    expect(normalizeBody('(productEmbed)(g1)(guide)(/x)', ctx)).toBe('[Guide One](/guias/G1)\n');
    expect(normalizeBody('(productEmbed)(zz)(guide)(/x)', ctx)).toBe('\n');
    expect(
      normalizeBody('(googleSheet)(https://docs.google.com/document/d/D1/edit)(Sheet)', ctx),
    ).toBe('[Sheet](/guias/G1/C9)\n');
  });

  it('strips junk link titles and rewrites links to exported content', () => {
    expect(normalizeBody('[t](https://e.test/p "" "_blank" "noopener noreferrer")', ctx)).toBe(
      '[t](https://e.test/p)\n',
    );
    expect(normalizeBody('[https://e.test/p](https://e.test/p "" "" "")', ctx)).toBe(
      '[https://e.test/p](https://e.test/p)\n',
    );
    expect(normalizeBody('see [doc](https://docs.google.com/document/d/D1/edit?x=1)', ctx)).toBe(
      'see [doc](/guias/G1/C9)\n',
    );
    expect(
      normalizeBody(
        '[[New] doc](https://docs.google.com/document/d/D1/edit "" "_blank" "noopener")',
        ctx,
      ),
    ).toBe('[[New] doc](/guias/G1/C9)\n');
    const bare = 'https://docs.google.com/document/d/D1/edit';
    expect(normalizeBody(`[${bare}](${bare} "" "_blank" "noopener")`, ctx)).toBe(
      '[Doc One](/guias/G1/C9)\n',
    );
  });

  it('flattens literal newline sequences inside spoiler text', () => {
    expect(normalizeBody('Hand[spoiler:Keep OTP\\nMull OTD]', ctx)).toBe(
      'Hand:spoiler[Keep OTP Mull OTD]\n',
    );
  });

  it('drops images that cannot be resolved', () => {
    expect(normalizeBody('a\n{{image:missing:large}}\nb', ctx)).toBe('a\n\nb\n');
  });
});
