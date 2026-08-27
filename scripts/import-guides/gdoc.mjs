// Converts a Google Docs HTML export into markdown. Two document shapes are
// supported: a single table (becomes a GFM table) and a sequence of
// paragraphs, where a fully bold paragraph is a heading, a run of dashes is a
// divider, a paragraph holding only a link is kept as a link, and any other
// text is a list item.

const ENTITIES = { amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", nbsp: ' ' };

function decode(text) {
  return text
    .replace(/&#(\d+);/g, (_, n) => String.fromCodePoint(Number(n)))
    .replace(/&([a-z]+);/g, (m, name) => ENTITIES[name] ?? m);
}

// Google wraps outbound links in a redirector; keep the real target.
function realHref(href) {
  try {
    const u = new URL(href);
    if (u.hostname === 'www.google.com' && u.pathname === '/url')
      return u.searchParams.get('q') ?? href;
  } catch {
    /* relative or malformed: keep as is */
  }
  return href;
}

function styledClasses(style, declaration) {
  return new Set(
    [...style.matchAll(/\.(c\d+)\{([^}]*)\}/g)]
      .filter((m) => m[2].includes(declaration))
      .map((m) => m[1]),
  );
}

/** Inline content of a block → markdown text. Returns { text, allBold }. */
function inlineOf(html, bold, italic) {
  let allBold = true;
  let text = '';
  const withoutAnchors = html.replace(/<a\b([^>]*)>([\s\S]*?)<\/a>/g, (_, attrs, body) => {
    const href = (attrs.match(/href="([^"]*)"/) || [])[1];
    const label = decode(body.replace(/<[^>]+>/g, '')).trim();
    return href && label ? `\u0000LINK[${label}](${decode(realHref(href))})\u0000` : label;
  });
  // Only spans carry styling; every other tag is either a line break or noise.
  const spansOnly = withoutAnchors.replace(/<br\s*\/?>/g, ' ').replace(/<(?!\/?span\b)[^>]+>/g, '');
  for (const s of spansOnly.matchAll(/<span\b([^>]*)>([\s\S]*?)<\/span>|([^<]+)/g)) {
    const cls = ((s[1] ?? '').match(/class="([^"]*)"/) || ['', ''])[1].split(/\s+/);
    const content = decode(s[2] ?? s[3] ?? '');
    if (!content.trim()) {
      text += content;
      continue;
    }
    const isBold = cls.some((c) => bold.has(c));
    const isItalic = cls.some((c) => italic.has(c));
    if (!isBold) allBold = false;
    text += s[3] !== undefined ? content : wrap(content, isBold, isItalic);
  }
  text = text
    .replace(/\u0000LINK(\[[^\]]*\]\([^)]*\))\u0000/g, '$1')
    .replace(/\s+/g, ' ')
    .trim();
  return { text, allBold: allBold && text.length > 0 };
}

function wrap(content, isBold, isItalic) {
  const lead = content.match(/^\s*/)[0];
  const trail = content.match(/\s*$/)[0];
  let core = content.trim();
  if (!core) return content;
  if (isItalic) core = `*${core}*`;
  if (isBold) core = `**${core}**`;
  return lead + core + trail;
}

function tableToMarkdown(tableHtml, bold, italic) {
  const rows = [...tableHtml.matchAll(/<tr\b[^>]*>([\s\S]*?)<\/tr>/g)].map((r) =>
    [...r[1].matchAll(/<t[dh]\b[^>]*>([\s\S]*?)<\/t[dh]>/g)].map((c) =>
      inlineOf(c[1].replace(/<\/p>\s*<p\b[^>]*>/g, '<br>'), bold, italic).text.replace(
        /\|/g,
        '\\|',
      ),
    ),
  );
  if (!rows.length) return '';
  const width = Math.max(...rows.map((r) => r.length));
  const pad = (r) => [...r, ...Array(width - r.length).fill('')];
  const [head, ...body] = rows.map(pad);
  return [
    `| ${head.join(' | ')} |`,
    `| ${head.map(() => '---').join(' | ')} |`,
    ...body.map((r) => `| ${r.join(' | ')} |`),
  ].join('\n');
}

export function gdocHtmlToMarkdown(html) {
  const style = (html.match(/<style[^>]*>([\s\S]*?)<\/style>/) || ['', ''])[1];
  const bold = styledClasses(style, 'font-weight:700');
  const italic = styledClasses(style, 'font-style:italic');
  const body = (html.match(/<body[^>]*>([\s\S]*)<\/body>/) || ['', html])[1];
  const blocks = [];
  for (const m of body.matchAll(/<(table|p|h[1-6])\b[^>]*>([\s\S]*?)<\/\1>/g)) {
    const [, tag, inner] = m;
    if (tag === 'table') {
      blocks.push({ kind: 'block', text: tableToMarkdown(inner, bold, italic) });
      continue;
    }
    // Paragraphs nested inside table cells are handled by the table branch.
    if (m.index > 0 && body.lastIndexOf('<table', m.index) > body.lastIndexOf('</table>', m.index))
      continue;
    const { text, allBold } = inlineOf(inner, bold, italic);
    if (!text) {
      // An empty paragraph is deliberate spacing: it ends a list run.
      blocks.push({ kind: 'break' });
      continue;
    }
    const plain = text.replace(/\*\*/g, '');
    if (/^h[1-6]$/.test(tag))
      blocks.push({ kind: 'block', text: `${'#'.repeat(Number(tag[1]) + 1)} ${plain}` });
    else if (/^-{3,}$/.test(plain)) blocks.push({ kind: 'block', text: '---' });
    else if (allBold) blocks.push({ kind: 'block', text: `### ${plain}` });
    else if (/^\[[^\]]*\]\([^)]*\)$/.test(text)) blocks.push({ kind: 'block', text });
    else blocks.push({ kind: 'list', text: `- ${text}` });
  }
  const out = [];
  let prevKind = null;
  for (const b of blocks) {
    if (b.kind === 'break') {
      prevKind = null;
      continue;
    }
    const contiguous = b.kind === 'list' && prevKind === 'list';
    if (out.length && !contiguous) out.push('');
    out.push(b.text);
    prevKind = b.kind;
  }
  return out.join('\n').trim() + '\n';
}
