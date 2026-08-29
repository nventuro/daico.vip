# Daico

A private household app: what the household has to do, buy, remember, keep and
pay. All data is sensitive and strictly gated behind Google sign-in — only
allowlisted accounts can see or change anything.

## Stack

React + TypeScript + Vite · Tailwind CSS v4 · Supabase (Postgres + Google OAuth) ·
GitHub Pages.

## Shell and modules

Daico is one app made of several small ones. The **shell** (`src/shell/`) owns
sign-in, membership, the home screen (a grid of app tiles) and the per-app frame
(a header with the app's name in its colour and a back link one level up). Each
feature is a **module** in `src/apps/<id>/` — its pages, hooks and the offline
tables it owns — described by an `AppModule` object (contract in
`src/apps/types.ts`) and listed in `src/apps/registry.ts`. The router and the
home screen are built from the registry; its order is the tile order.

**Buscar** (`/buscar`, the magnifier in the header) searches every app at once.
A module takes part by exporting an optional `search(query)` adapter returning
its hits (title, optional subtitle, link); the page runs every adapter and
groups the results by app, in registry order. Matching is case- and
accent-insensitive (`noquis` finds "Ñoquis"), and each adapter reads its own
local store, so search works with no connection.

**Próximo** is the home screen's list of what is coming up: every module's
`useUpcoming()` entries merged and sorted soonest-first. The home screen shows
the first `UPCOMING_MAX_ROWS` (4); when there are more, "Ver todo" opens
`/proximo` with the same entries in full.

### Adding an app

1. Create `src/apps/<id>/index.ts` exporting an `AppModule`: `id`, `name`,
   `icon`, the `TableSpec`s it owns and its `routes` (relative to `/<id>`, pages
   `lazy()`-loaded at module scope).
2. Add the id to `APP_IDS` in `src/apps/types.ts` and a `--color-app-<id>` token
   to the `@theme static` block in `src/index.css` — an app's colour is its id,
   and a test checks the registry and the theme against that one list.
3. Append the module to `apps` in `src/apps/registry.ts`.
4. Its tables go in `src/lib/offline/specs.ts` / `ALL_SPECS` **and** in the
   module's `specs` — a test checks the two agree.

## Offline-first

Every table works with **no connection** — you can open the app, add, check off
and delete offline (at a shop with no signal, say), and it all syncs once you
are back online. There's no spinner on any action: the UI reads and writes a
local database and the network happens in the background.

Three pieces make this work:

- **PWA / service worker** (`vite-plugin-pwa`). The first online visit precaches
  the app shell — including the ~1.5 MB SQLite WebAssembly — so the app _opens and
  runs_ with no network. Installable ("Add to Home Screen") for a fullscreen,
  app-like launch. GitHub Pages serves it over HTTPS, which service workers
  require; no custom headers are needed (see the SQLite note below).

- **Local SQLite** (`src/lib/offline/`). [SQLocal](https://sqlocal.dev) runs SQLite
  in a Web Worker, persisted to the browser's [OPFS](https://developer.mozilla.org/en-US/docs/Web/API/File_System_API/Origin_private_file_system).
  A custom worker (`sahpoolWorker.ts`) opens the database through the **OPFS
  SAH-pool VFS**, which — unlike SQLocal's default OPFS VFS — reaches OPFS through
  worker-only sync access handles, needing no `SharedArrayBuffer` and therefore no
  `COOP`/`COEP` response headers, which **GitHub Pages can't set**. (SQLocal's
  default would silently fall back to a throwaway in-memory database.) The trade is
  one connection per browser: `singleTab.ts` grants it to one tab with a Web Lock,
  and a second tab shows an "already open in another tab" notice. `engine.ts` is
  the source of truth the UI reads/writes; every change is instant and offline-safe.

- **Sync engine** (`src/lib/offline/sync.ts`). On load, on reconnect, on app
  focus and after every local change it pushes queued local changes and pulls
  the server state; a screen that opens asks for a run only when the last one
  is older than a minute, so moving around the app doesn't sync at every tap. Conflicts use
  **last-write-wins** by an `updated_at` timestamp set at edit time, enforced on
  both sides: the pull applies only newer rows, and a trigger on every table
  skips a pushed row older than the stored one, so devices converge instead of
  overwriting each other. Deletes win over a concurrent edit. Each row carries a
  client-generated UUID so an offline-created row has a stable identity before
  it ever reaches the server.

The membership check is also offline-tolerant: the verdict cached per user
answers first — so a launch never waits on the server — and the live read then
confirms or revokes it; with no signal the cached verdict stands, so a member
isn't locked out. This is only a UI gate — the server's RLS is still the real
authority (see `CLAUDE.md`).

### Loading

Nothing says "Cargando". A **splash** is painted before any script runs —
static markup in `index.html`, hidden by a rule in `index.css` once React has
drawn into `#root` — and a gate still resolving (session, membership, key)
renders `null`, so the splash simply stays; the login screen shares its frame,
so nothing moves when it takes over. `sync.ts` keeps a **sync status**
(`useSyncStatus`): whether a run is on, and when one last went through whole on
this device — every table and the after-sync file work — which is what
`FirstSyncScreen` waits for and what the home screen quotes while offline. A
wait is shown, never written: a list holds its place with `SkeletonRows`, and
anything being fetched carries `LoadingLine`.

### Adding another offline table

1. Migration: create the table with a `uuid` primary key (client-supplied) and an
   `updated_at` timestamp, plus the usual RLS + `private.is_member()` policy +
   `authenticated` grants and the `private.last_write_wins()` trigger every synced
   table has. `updated_at` is **the client's to set** — never add a trigger that
   bumps it, or an edit made offline would be ordered by the time it synced.
   `db:verify` checks both.
2. Add a `TableSpec` to `src/lib/offline/specs.ts` (and to `ALL_SPECS`), and list
   it in the `specs` of the module that owns it (`src/apps/<id>/index.ts`).
3. Add a thin typed hook (see `useShoppingList` / `useChores`) over
   `useOfflineTable`. No new sync code needed.

### Adding a column to an existing offline table

1. Migration: `alter table ... add column`. A `not null` column needs a **default**,
   or Postgres refuses it on a table that already holds rows. No new RLS/grant: a
   column inherits the table's.
2. Add the column to the table's `TableSpec.columns`. The engine creates it for new
   clients and brings each existing local database up to the spec on next load —
   with `ADD COLUMN` where SQLite takes the column, and otherwise by making the
   table again, which the next sync fills from the server. Sync carries the column
   automatically.
3. If you **backfill** existing rows, bump their `updated_at` in the same migration
   so the value reaches already-synced clients (their last-write-wins pull only
   takes a strictly newer row). Run it once every device has synced, so no unsynced
   offline edit predates the bump. (See `20260625000000_shopping_position.sql`.)

### Caveats

- **Last-write-wins** is per-row by client clock. Fine for 1–2 users; clock skew
  could in theory misorder near-simultaneous edits on different devices. A delete
  is pushed unconditionally ("delete wins"), so deleting an entry another device
  just edited removes it — but a pull never drops a row this device has edited
  and not yet pushed, and that edit then goes up, which brings the entry back
  for everyone.
- **One tab at a time.** The SAH-pool VFS allows a single connection per browser,
  so only one tab uses the local database; a second tab shows an "already open in
  another tab" notice (close it and reload to take over). No data is lost — every
  tab still reconciles through the server.
- **OPFS sync access handles** (what the SAH-pool VFS uses) need Chrome/Android or
  desktop Firefox ≥ 111 — both target browsers qualify.
- Local data is wiped on sign-out (shared-device hygiene).

## The apps

Every one of these tables is offline-synced, so all of it works with no
connection. What each app does with its rows is the code's to say; what follows
is what the rows are and what may never change about them.

**Tareas** — `chores`: a title, an optional due date (`due_on`, a plain date)
and notes. A task is done or not.

**Compras** — `shopping_items`: a name, whether it is in the cart, and a
fractional index (`position`), so reordering the list writes one row.

**Fechas** — `dates`: birthdays, appointments, renewals. Nothing is ever
"done". `occurs_on` is the **anchor the user entered and the app never
rewrites**: for a repeating entry (yearly, or every N months) the next
occurrence is computed on read, so a birthday rolls over with no writes at all.
`notice_days` decides how far ahead the entry reaches Próximo.

**Recetas** — `recipes`: a title, an optional time and number of servings, and
a markdown body in the dialect below. An `:::ingredients` block renders as a
tickable list whose rows can be sent to Compras; the ticks are a reading aid
for the session and are never saved.

**Documentos** — `documents`: a title, an optional expiry (`expires_on`) and
its notice window. The content of a document is its attachments — the pictures
of it, encrypted on the device. **Nothing else is typed in, deliberately**, so
a number or a date of birth never reaches the server in the clear. Every
document's files are kept on every device, so a document can be read with no
connection wherever it was added.

**Gastos** — `statements`, read on the device from the PDF the bank sends. The
row keeps in the clear only what lists it — the layout it was read with
(`format`), its closing and due dates, its two totals, whether it was paid —
while every purchase and installment travels in `payload`, gzipped and
encrypted under the household key exactly like an attachment's file. **The PDF
is never kept, and neither is who made a purchase**: the per-card totals the
bank prints are checked against, and no name from the statement is stored.
There is one parser per layout (`src/apps/gastos/parsers/`, Galicia Visa and
Galicia Mastercard so far), reading the positioned words pdf.js extracts; an
import whose lines do not add up to the printed totals, or whose layout none of
them knows, saves nothing.

A purchase is filed under one of a fixed set of categories by **merchant
rules** (`merchant_rules`: an encrypted pattern, a category in the clear),
longest match winning, the bank's own charges always `impuestos`. **There is no
built-in list of merchants** — where the household shops is private, so every
rule is the household's own, written from a line or pasted in bulk on the
Categorización page — and **rules apply on display**, so a new rule refiles
every statement at once. A line can be marked _puntual_, a mark kept inside the
payload, and every view splits spending into base and one-offs. **Gastos
contributes nothing to Buscar**: searching it would mean unsealing every
statement on every keystroke.

**Guías** — `guides` / `guide_chapters`: imported content the app never writes
(see Guides below), in the same markdown dialect.

## Markdown dialect

Guide chapters and recipe bodies share one reader (`src/components/markdown/`):
CommonMark + GFM tables, plus these
[remark-directive](https://github.com/remarkjs/remark-directive) forms mapped to
components:

- `::image{key="…" width="60" align="center"}` — an image by key, width as a
  percentage of the column. Only guides can resolve one (they own an image
  cache); anywhere else it renders nothing.
- `::youtube{id="…" start="0"}` — an embed; a plain link when offline.
- `:spoiler[text]` — tap to reveal.
- `:::ingredients` … `:::` — a markdown list (`-`, `*` or `1.`) inside; each
  item becomes a tickable row with an "add to Compras" button. Only a recipe
  renders it (`RecipeMarkdown`), since only there is there a list to add to.
  Inline markup in an item is flattened to plain text; anything that isn't a
  list item is ignored.

Links to other guides or chapters are ordinary relative links
(`/guias/<guide>/<chapter>`).

## Adjuntos

A chore or a document can carry attachments — pictures, up to
`ATTACHMENT_MAX_BYTES` each — that are encrypted on the device before they
leave it, so the server only ever stores ciphertext.

- **Tables and bucket**: `attachments` (owner, optional name, mime, size, the
  wrapped file key) is an ordinary offline-synced table; the file bytes live in
  the private `attachments` storage bucket under the row's id, and on the device
  in the local-only `attachment_files` table (a file added here waits there
  until uploaded; one opened here is kept for offline reading). The bytes are
  immutable: a different picture is a new attachment.
- **Keys**: a six-word phrase (like a seed phrase, from the BIP-39 Spanish list)
  derives, through PBKDF2, the key that wraps the household's master key
  (stored wrapped in `household_key`, one row); the master key wraps one key per
  file; the file key encrypts the file with AES-GCM. A device unwraps the master
  key once, when the phrase is typed, and keeps it non-extractable in
  IndexedDB. Everything the server holds is useless without the phrase, and the
  phrase exists only on paper: losing it loses the documents.
- **The phrase gate**: a device without the master key stops right after login,
  before the home screen, and asks for the phrase. The very first time (no
  `household_key` row yet) the app generates the phrase and asks for it to be
  written down. Signing out forgets the key.
- **In the app**: attachments are a grid on the entry's own page, added through
  a dialog that turns, crops and names each picture, and opened in a lightbox.
  A picture left as it came is stored byte for byte; an edited one is drawn
  afresh as JPEG (a PNG stays PNG). The open picture is an optional
  `:attachmentId` ending the entry's route, so it has a URL of its own — a
  search hit links straight to it, and the phone's back gesture closes it. The
  grid, dialog and lightbox are shared (`src/components/Attachment*`), so every
  app that takes pictures takes them the same way.
- **Sync**: files follow every table sync (`afterSync`): uploads go out, files
  of deleted rows are dropped, every document's files this device lacks are
  fetched and kept, and bucket objects no row refers to and older than
  `ATTACHMENT_ORPHAN_MIN_AGE_MS` are removed — never against rows the run did
  not bring down, and never against an empty table, since what the sweep cannot
  tell from an orphan is a file this device has not heard of yet. A file the
  bucket refuses for good (too large, wrong type) is marked failed and not
  retried.

## Guides

Guides are read-only reference documents (a guide → sections → chapters) that
members can read offline. They are never edited in the app: rows come from an
import script, and the app only reads them.

- **Tables**: `guides` and `guide_chapters` are ordinary offline-synced tables
  (see above), so chapters land in the local SQLite and read with no connection.
  `guide_images` is **not** synced — images are too large to pull wholesale on
  every sync — so the app fetches each image the first time a chapter needs it
  and keeps it in a local-only cache table (`guide_image_cache`); previously read
  chapters render offline. All three are `select`-only for `authenticated`.
- **Chapter bodies** are written in the markdown dialect above.

### Importing guides

```
npm run guides:import -- --dump <dir> [--dry-run] [--preview <dir>]
```

The dump directory (kept **outside the repo** — it's private content) has:

```
guides/<slug>.json   metadata, sections and chapters in the source site's markdown,
                     plus an image map (token reference → file)
images/              the referenced image files
docs/index.json      linked documents (HTML exports) with titles
decklists/index.json linked decklists (plain text) with titles and source URLs
```

The importer (`scripts/import-guides.mjs`, helpers in `scripts/import-guides/`)
converts the source dialect to the markdown above (`normalize.mjs`), turns linked
documents and decklists into chapters in an "Adjuntos" section and rewrites links
to them in-app, and recompresses images to WebP (≤ 1600 px). Everything
source-specific stays in the importer; the app only knows the dialect above.

Ids derive from the source identifiers (UUID v5), so re-running the import
replaces the guides wholesale while keeping every id — clients update in place via
the normal sync and links keep working. `--dry-run` skips the database;
`--preview <dir>` writes each chapter's normalized markdown as a file to inspect.
Missing attachment files are reported and their links left external.

## Local development

```bash
npm install
npm run dev      # dev server
npm test         # the whole suite once (npm run test:watch to keep it running)
npm run lint
npm run format   # format:check only reports
npm run build    # tsc -b + the production build
npm run preview  # serves the build, the one place the CSP is live locally
```

The tests run on real SQLite in-process and a stand-in for the server, so they
need nothing running; CI runs the same four checks on every push to `main`. The
app won't
authenticate until you wire up a Supabase project (below).

## First-time setup

### 1. Create the Supabase project

- Create a project at [supabase.com](https://supabase.com).
- Copy the project URL and the **publishable** key (`sb_publishable_...`) from
  Project Settings → API Keys into `src/config.ts`. (The legacy anon JWT key still
  works but is deprecated — use the publishable key.)
- Create a `.env` (gitignored) with:
  ```
  SUPABASE_PROJECT_REF=your-project-ref
  SUPABASE_DB_PASSWORD=your-db-password
  ```

### 2. Configure Google OAuth

- In the [Google Cloud Console](https://console.cloud.google.com): set up an OAuth
  consent screen and create OAuth client credentials (Web application).
- Add the Supabase callback URL as an authorized redirect URI:
  `https://<project-ref>.supabase.co/auth/v1/callback`.
- In the Supabase dashboard → Authentication → Providers → Google: enable it and
  paste the client ID and secret.
- In Authentication → URL Configuration: set the Site URL to the production URL
  and add `http://localhost:5173` as an additional redirect URL for local dev.

### 3. Push the schema

```bash
npm run db:link   # once
npm run db:push
```

Then add the authorized Google account emails to the `members` table via the
Supabase SQL editor — only those accounts can access
the app. Until a member exists, the app denies everyone.

### 4. Deploy

Pushing to `main` triggers `.github/workflows/deploy.yml`, which builds and deploys
to GitHub Pages.
