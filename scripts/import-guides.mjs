// =============================================================================
// Import a guides dump into the database, replacing whatever guides are there.
//
//   npm run guides:import -- --dump <dir> [--dry-run] [--preview <dir>]
//
// The dump directory holds `guides/<slug>.json` (metadata, sections, chapters
// with the source site's markdown, and an image map), `images/`, `docs/`
// (HTML exports of linked documents + index.json) and `decklists/` (text lists
// + index.json). Chapter bodies are normalized to the app's markdown dialect,
// linked documents and decklists become chapters in an "Adjuntos" section, and
// images are recompressed to WebP. Ids derive from the source identifiers, so
// re-running updates rows in place.
//
// `--dry-run` skips the database; `--preview <dir>` writes every normalized
// chapter as a .md file for inspection. Connection details come from .env and
// the linked project (see scripts/lib/db.mjs).
// =============================================================================
import fs from 'node:fs/promises';
import path from 'node:path';
import { createRequire } from 'node:module';
import { Client, clientOptions, root } from './lib/db.mjs';
import { stableId } from './import-guides/ids.mjs';
import { normalizeBody, rewriteLinks } from './import-guides/normalize.mjs';
import { gdocHtmlToMarkdown } from './import-guides/gdoc.mjs';
import { decklistToMarkdown } from './import-guides/decklist.mjs';

const sharp = createRequire(path.join(root, 'node_modules/'))('sharp');

const ATTACHMENTS_SECTION = 'Adjuntos';
// The source names its sections in English; the app is in Spanish.
const SECTION_TITLES = { 'Main Section': 'Principal', Outdated: 'Desactualizado' };
const IMAGE_MAX_WIDTH = 1600;
const IMAGE_QUALITY = 80;

// ---- CLI ----------------------------------------------------------------------------------

const args = process.argv.slice(2);
const opt = (name) => {
  const i = args.indexOf(name);
  if (i === -1) return null;
  const v = args[i + 1];
  args.splice(i, 2);
  return v;
};
const flag = (name) => {
  const i = args.indexOf(name);
  if (i === -1) return false;
  args.splice(i, 1);
  return true;
};
const dumpDir = opt('--dump');
const previewDir = opt('--preview');
const dryRun = flag('--dry-run');
if (!dumpDir) {
  console.error('usage: import-guides.mjs --dump <dir> [--dry-run] [--preview <dir>]');
  process.exit(1);
}

const warnings = [];
const warn = (m) => warnings.push(m);

// ---- dump ---------------------------------------------------------------------------------

const readJson = async (p) => JSON.parse(await fs.readFile(p, 'utf8'));
const exists = (p) =>
  fs.access(p).then(
    () => true,
    () => false,
  );

const guidesDir = path.join(dumpDir, 'guides');
const dumps = [];
for (const f of (await fs.readdir(guidesDir)).filter((f) => f.endsWith('.json')).sort()) {
  dumps.push(await readJson(path.join(guidesDir, f)));
}
const docsIndex = (await exists(path.join(dumpDir, 'docs/index.json')))
  ? await readJson(path.join(dumpDir, 'docs/index.json'))
  : {};
const decklistsIndex = (await exists(path.join(dumpDir, 'decklists/index.json')))
  ? await readJson(path.join(dumpDir, 'decklists/index.json'))
  : {};

// ---- link resolution --------------------------------------------------------------------

const idSuffix = (slug) => slug.split('-').pop();
const canonicalUrl = (url) => {
  try {
    const u = new URL(url);
    return `${u.hostname.replace(/^www\./, '')}${u.pathname.replace(/\/+$/, '')}`.toLowerCase();
  } catch {
    return url;
  }
};
const docIdOf = (url) => (url.match(/docs\.google\.com\/document\/d\/([^/?#]+)/) || [])[1] ?? null;

const guideRecords = new Map(); // product id suffix → { id, slug, title, description, dump }
for (const g of dumps) {
  const id = stableId(`guide:${g.product.slug}`);
  guideRecords.set(idSuffix(g.product.slug), {
    id,
    slug: g.product.slug,
    title: g.product.name,
    description: g.product.description ?? null,
    dump: g,
  });
}
const decklistByUrl = new Map(
  Object.entries(decklistsIndex).map(([file, d]) => [canonicalUrl(d.url), { file, ...d }]),
);

// The attachments a guide's chapters point at, in first-reference order, plus
// any decklist a linked document itself points at (a cheat sheet links its list).
async function collectAttachments(dump) {
  const seen = new Map(); // attachment key → { kind, ref, title }
  const consider = (url) => {
    const docId = docIdOf(url);
    if (docId && docsIndex[docId] && !seen.has(`doc:${docId}`))
      seen.set(`doc:${docId}`, { kind: 'doc', ref: docId, title: docsIndex[docId].title });
    const deck = decklistByUrl.get(canonicalUrl(url));
    if (deck && !seen.has(`deck:${deck.file}`))
      seen.set(`deck:${deck.file}`, { kind: 'deck', ref: deck.file, title: deck.title });
  };
  // Google Docs wrap outbound links in a redirector; the real target is its `q` parameter.
  const unwrap = (url) =>
    url.includes('google.com/url?') ? (new URL(url).searchParams.get('q') ?? url) : url;
  const urlsIn = (text) => [...text.matchAll(/https?:\/\/[^\s)"\]]+/g)].map((m) => unwrap(m[0]));
  for (const s of dump.sections)
    for (const c of s.chapters) urlsIn(c.content ?? '').forEach(consider);
  for (const a of [...seen.values()].filter((x) => x.kind === 'doc')) {
    const file = path.join(dumpDir, 'docs', docsIndex[a.ref].files.html);
    if (await exists(file))
      urlsIn(decodeURIComponent((await fs.readFile(file, 'utf8')).replace(/&amp;/g, '&'))).forEach(
        consider,
      );
  }
  return [...seen.entries()].map(([key, a]) => ({ ...a, key }));
}

// ---- build rows ---------------------------------------------------------------------------

const now = new Date().toISOString();
const guides = [];
const chapters = [];
const images = new Map(); // key → { file, guideId }
const summary = [];

for (const rec of guideRecords.values()) {
  const { dump } = rec;
  const attachments = [];
  for (const a of await collectAttachments(dump)) {
    const file =
      a.kind === 'doc'
        ? path.join(dumpDir, 'docs', docsIndex[a.ref].files.html)
        : path.join(dumpDir, 'decklists', a.ref);
    if (await exists(file)) attachments.push({ ...a, position: attachments.length + 1 });
    else warn(`${rec.title}: attachment file missing, link left external: ${a.title}`);
  }
  const attachmentChapterId = (a) => stableId(`attachment:${rec.slug}:${a.key}`);
  const attachmentRoute = new Map(
    attachments.map((a) => [
      a.key,
      { path: `/guias/${rec.id}/${attachmentChapterId(a)}`, title: a.title },
    ]),
  );
  const chapterIdOf = (chapterSlug) => stableId(`chapter:${rec.slug}:${chapterSlug}`);
  const chapterTitles = new Map(
    dump.sections.flatMap((s) => s.chapters.map((c) => [c.slug, c.title.trim()])),
  );

  const ctx = {
    imageKey: (ref) => {
      const entry = dump.images?.[ref];
      if (!entry) return null;
      const key = entry.file.replace(/\.[^.]+$/, '');
      if (!images.has(key))
        images.set(key, { file: path.join(dumpDir, 'images', entry.file), guideId: rec.id });
      return key;
    },
    guideRoute: (productId) => {
      const target = guideRecords.get(productId);
      return target ? { path: `/guias/${target.id}`, title: target.title } : null;
    },
    linkRoute: (url) => {
      const docId = docIdOf(url);
      if (docId && attachmentRoute.has(`doc:${docId}`)) return attachmentRoute.get(`doc:${docId}`);
      const deck = decklistByUrl.get(canonicalUrl(url));
      if (deck && attachmentRoute.has(`deck:${deck.file}`))
        return attachmentRoute.get(`deck:${deck.file}`);
      const m = url.match(/metafy\.gg\/guides\/view\/([^/?#]+)(?:\/([^/?#]+))?/);
      if (m) {
        const target = guideRecords.get(idSuffix(m[1]));
        if (!target) return null;
        if (m[2] && target === rec && chapterTitles.has(m[2])) {
          return { path: `/guias/${rec.id}/${chapterIdOf(m[2])}`, title: chapterTitles.get(m[2]) };
        }
        return { path: `/guias/${target.id}`, title: target.title };
      }
      return null;
    },
    warn: (m) => warn(`${rec.title}: ${m}`),
  };

  guides.push({
    id: rec.id,
    title: rec.title,
    description: rec.description,
    created_at: now,
    updated_at: now,
  });
  let count = 0;
  // Sections are listed in reading order in the dump; chapters carry their own position.
  dump.sections.forEach((section, sectionIndex) => {
    for (const ch of [...section.chapters].sort((a, b) => a.position - b.position)) {
      chapters.push({
        id: chapterIdOf(ch.slug),
        guide_id: rec.id,
        section_title: SECTION_TITLES[section.title] ?? section.title,
        section_position: sectionIndex + 1,
        position: ch.position,
        // A guide with a single, untitled chapter is titled after the guide.
        title: ch.title.trim() || rec.title,
        body: normalizeBody(ch.content ?? '', ctx),
        created_at: now,
        updated_at: now,
      });
      count++;
    }
  });
  const attachmentsPosition = dump.sections.length + 1;
  for (const a of attachments) {
    const file =
      a.kind === 'doc'
        ? path.join(dumpDir, 'docs', docsIndex[a.ref].files.html)
        : path.join(dumpDir, 'decklists', a.ref);
    const converted =
      a.kind === 'doc'
        ? gdocHtmlToMarkdown(await fs.readFile(file, 'utf8'))
        : decklistToMarkdown(await fs.readFile(file, 'utf8'));
    const body = rewriteLinks(converted, ctx);
    chapters.push({
      id: attachmentChapterId(a),
      guide_id: rec.id,
      section_title: ATTACHMENTS_SECTION,
      section_position: attachmentsPosition,
      position: a.position,
      title: a.title,
      body,
      created_at: now,
      updated_at: now,
    });
  }
  summary.push(`${rec.title}: ${count} chapters, ${attachments.length} attachments`);
}

// ---- images -------------------------------------------------------------------------------

const imageRows = [];
let imageBytes = 0;
for (const [key, { file, guideId }] of images) {
  const { data, info } = await sharp(file)
    .resize({ width: IMAGE_MAX_WIDTH, withoutEnlargement: true })
    .webp({ quality: IMAGE_QUALITY })
    .toBuffer({ resolveWithObject: true });
  imageBytes += data.length;
  imageRows.push({
    id: stableId(`image:${key}`),
    guide_id: guideId,
    key,
    mime: 'image/webp',
    width: info.width,
    height: info.height,
    data: data.toString('base64'),
  });
}

// ---- preview ------------------------------------------------------------------------------

if (previewDir) {
  await fs.rm(previewDir, { recursive: true, force: true });
  for (const c of chapters) {
    const g = guides.find((x) => x.id === c.guide_id);
    const dir = path.join(previewDir, g.title.replace(/[^\w-]+/g, '_'));
    await fs.mkdir(dir, { recursive: true });
    const name = `${String(c.section_position).padStart(2, '0')}-${String(c.position).padStart(2, '0')}-${c.title.replace(/[^\w-]+/g, '_').slice(0, 40)}.md`;
    await fs.writeFile(path.join(dir, name), `# ${c.title}\n\n${c.body}`);
  }
}

// ---- write --------------------------------------------------------------------------------

if (!dryRun) {
  const client = new Client(clientOptions());
  await client.connect();
  try {
    await client.query('begin');
    await client.query('delete from guides');
    for (const g of guides) {
      await client.query(
        'insert into guides (id, title, description, created_at, updated_at) values ($1, $2, $3, $4, $5)',
        [g.id, g.title, g.description, g.created_at, g.updated_at],
      );
    }
    for (const c of chapters) {
      await client.query(
        'insert into guide_chapters (id, guide_id, section_title, section_position, position, title, body, created_at, updated_at) values ($1, $2, $3, $4, $5, $6, $7, $8, $9)',
        [
          c.id,
          c.guide_id,
          c.section_title,
          c.section_position,
          c.position,
          c.title,
          c.body,
          c.created_at,
          c.updated_at,
        ],
      );
    }
    for (const im of imageRows) {
      await client.query(
        'insert into guide_images (id, guide_id, key, mime, width, height, data) values ($1, $2, $3, $4, $5, $6, $7)',
        [im.id, im.guide_id, im.key, im.mime, im.width, im.height, im.data],
      );
    }
    await client.query('commit');
  } catch (e) {
    await client.query('rollback');
    throw e;
  } finally {
    await client.end();
  }
}

console.log(summary.join('\n'));
console.log(
  `${guides.length} guides, ${chapters.length} chapters (${(chapters.reduce((n, c) => n + c.body.length, 0) / 1024).toFixed(0)} KB), ${imageRows.length} images (${(imageBytes / 1e6).toFixed(1)} MB WebP)`,
);
for (const w of warnings) console.log(`warning: ${w}`);
console.log(dryRun ? 'dry run — database untouched' : 'written');
