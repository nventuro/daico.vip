// Converts the source site's markdown dialect into the app's: CommonMark plus
// remark-directive syntax for images, videos and spoilers, with links to other
// exported content rewritten to in-app routes.
//
// Source conventions handled here:
//   - every line is a block (no soft-wrapped paragraphs); blank lines are spacing
//   - {{image:<id>:<size>}} and {{image-v2:<id|url>:<width>:<align>[:spoiled]}}
//   - (youtube)(<id>)(<startSeconds>), (productEmbed)(<id>)(guide)(<path>),
//     (googleSheet)(<url>)(<title>), (br-line), [spoiler:<text>]
//   - link titles carrying target/rel junk: [t](url "" "_blank" "noopener")

const BLOCK_TOKEN =
  /\{\{image(?:-v2)?:[^}]*\}\}|\(youtube\)\([^)]*\)\([^)]*\)|\(productEmbed\)\([^)]*\)\([^)]*\)\([^)]*\)|\(googleSheet\)\([^)]*\)\([^)]*\)/g;

const LIST_LINE = /^\s*(?:[-*]|\d+\.)\s/;
const QUOTE_LINE = /^>/;

const attr = (v) => `"${String(v).replace(/"/g, '&quot;')}"`;

/**
 * `ctx` resolves references to exported content:
 *   imageKey(ref)        → key stored in the app, or null if the image is unavailable
 *   guideRoute(id)       → { path, title } for an embedded guide reference, or null
 *   linkRoute(url)       → { path, title } for a URL that points at exported content, or null
 *   warn(message)
 */
export function normalizeBody(source, ctx) {
  const lines = [];
  for (const rawLine of source.split(/\r?\n/)) {
    for (const part of rawLine.split('(br-line)')) {
      let last = 0;
      for (const m of part.matchAll(BLOCK_TOKEN)) {
        pushText(lines, part.slice(last, m.index));
        lines.push(convertToken(m[0], ctx));
        last = m.index + m[0].length;
      }
      pushText(lines, part.slice(last));
      if (part === '' && rawLine === '') lines.push('');
    }
  }
  return assemble(lines.map((l) => (l.startsWith('::') ? l : inline(l, ctx))));
}

// Leading indentation only matters for nested list items; elsewhere it is noise.
function pushText(lines, text) {
  const t = text.trimEnd();
  if (!t.trim()) return;
  lines.push(LIST_LINE.test(t) ? t : t.trimStart());
}

function convertToken(token, ctx) {
  let m;
  if ((m = token.match(/^\{\{image:([^:}]+):?([^}]*)\}\}$/))) {
    return imageDirective(ctx, m[1], m[2] === 'small' ? 50 : 100, 'center', false);
  }
  if ((m = token.match(/^\{\{image-v2:(https?:\/\/[^}]+?|[^:}]+)(?::([^:}]*))?(?::([^:}]*))?(?::([^:}]*))?\}\}$/))) {
    return imageDirective(ctx, m[1], Number(m[2]) || 100, m[3] || 'center', m[4] === 'spoiled');
  }
  if ((m = token.match(/^\(youtube\)\(([^)]*)\)\(([^)]*)\)$/))) {
    return `::youtube{id=${attr(m[1])} start=${attr(Number(m[2]) || 0)}}`;
  }
  if ((m = token.match(/^\(productEmbed\)\(([^)]*)\)\(([^)]*)\)\(([^)]*)\)$/))) {
    const route = ctx.guideRoute(m[1]);
    if (!route) {
      ctx.warn(`unresolved guide embed ${m[3]}`);
      return '';
    }
    return `[${route.title}](${route.path})`;
  }
  if ((m = token.match(/^\(googleSheet\)\(([^)]*)\)\(([^)]*)\)$/))) {
    const route = ctx.linkRoute(m[1]);
    if (!route) ctx.warn(`external document kept as link: ${m[1]}`);
    return `[${m[2] || route?.title || m[1]}](${route?.path ?? m[1]})`;
  }
  return token;
}

function imageDirective(ctx, ref, width, align, spoiled) {
  const key = ctx.imageKey(ref);
  if (!key) {
    ctx.warn(`image unavailable: ${ref}`);
    return '';
  }
  const w = Math.max(10, Math.min(100, Math.round(width)));
  return `::image{key=${attr(key)} width=${attr(w)} align=${attr(align)}${spoiled ? ' spoiled="true"' : ''}}`;
}

// Spoiler text is inline, and the source sometimes carries literal "\n"
// sequences (two characters) inside it; a space is the closest inline reading.
function inline(line, ctx) {
  return rewriteLinks(
    line.replace(/\[spoiler:([^\]]*)\]/g, (_, text) => `:spoiler[${text.replace(/\\n/g, ' ').replace(/\s+/g, ' ').trim()}]`),
    ctx,
  );
}

// Link text may itself contain one level of brackets ("[New] Cheat sheet").
const LINK = /\[((?:[^\[\]]|\[[^\]]*\])*)\]\((\S+?)(?:\s+"[^"]*")*\)/g;

/**
 * Strip link titles and point links at exported content to their in-app route.
 * A link whose text is just the URL takes the target's title once it is in-app.
 */
export function rewriteLinks(markdown, ctx) {
  return markdown.replace(LINK, (_, text, url) => {
    const route = ctx.linkRoute(url);
    let label = text.trim() || url;
    if (route && label === url) label = route.title;
    return `[${label}](${route?.path ?? url})`;
  });
}

// Every source line is a block: separate them with blank lines, except that
// consecutive list items (and quote lines) must stay contiguous to form one list.
function assemble(lines) {
  const out = [];
  let prevKind = null;
  for (const line of lines) {
    if (!line) {
      prevKind = null;
      continue;
    }
    const kind = LIST_LINE.test(line) ? 'list' : QUOTE_LINE.test(line) ? 'quote' : 'block';
    const contiguous = kind !== 'block' && kind === prevKind;
    if (out.length && !contiguous) out.push('');
    out.push(line);
    prevKind = kind;
  }
  return out.join('\n').trim() + '\n';
}
