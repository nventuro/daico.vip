# Daico

A private household app — track chores, appointments, and personal documents. All
data is sensitive and strictly gated behind Google sign-in: only allowlisted
accounts can see or change anything.

## Stack

React + TypeScript + Vite · Tailwind CSS v4 · Supabase (Postgres + Google OAuth) ·
GitHub Pages.

## Apps

Daico is one app made of several small ones. The **shell** (`src/shell/`) owns
sign-in, membership, the home screen (a grid of app tiles) and the per-app frame
(a header with the app's name in its colour and a back link one level up). Each
feature is a **module** in `src/apps/<id>/` — its pages, hooks and the offline
tables it owns — described by an `AppModule` object (contract in
`src/apps/types.ts`) and listed in `src/apps/registry.ts`. The router and the
home screen are built from the registry; its order is the tile order.

**Buscar** (`/buscar`, the magnifier in the header) searches every app at once.
A module takes part by exporting an optional `search(query)` adapter that
returns its hits (title, optional subtitle, link); the page runs every adapter
and shows the results grouped by app, in registry order. Matching is case- and
accent-insensitive (`noquis` finds "Ñoquis"), and since each adapter reads the
app's local store it works with no connection.

**Próximo** is the home screen's list of what is coming up: every module's
`useUpcoming()` entries merged and sorted soonest-first. The home screen shows
the first `UPCOMING_MAX_ROWS` (4); when there are more, "Ver todo" opens
`/proximo`, the same entries in full, grouped by day ("Vencidas", "Hoy",
"Mañana", the weekday for the rest of the week, then one group per month).

### Adding an app

1. Create `src/apps/<id>/index.ts` exporting an `AppModule`: `id`, `name`, `hue`,
   `icon`, the `TableSpec`s it owns and its `routes` (relative to `/<id>`, pages
   `lazy()`-loaded at module scope).
2. Add a `--color-app-<id>` token to the `@theme static` block in `src/index.css`
   and the hue to `AppHue` (and the id to `AppId`) in `src/apps/types.ts`.
3. Append the module to `apps` in `src/apps/registry.ts`.
4. Its tables go in `src/lib/offline/specs.ts` / `ALL_SPECS` **and** in the
   module's `specs` — a test checks the two agree.

## Offline-first

Chores, the shopping list, dates and recipes work with **no connection** — you can open
the app, add, check off, and delete items offline (e.g. at a shop with no
signal), and it all syncs automatically once you're back online. There's no spinner on any
action: the UI reads and writes a local database and the network happens in the
background.

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

- **Sync engine** (`src/lib/offline/sync.ts`). On load, on reconnect, and on app
  focus it pushes queued local changes and pulls the server state. Conflicts use
  **last-write-wins** by an `updated_at` timestamp set at edit time, enforced on
  both sides: the pull applies only newer rows, and a trigger on every table
  skips a pushed row older than the stored one, so devices converge instead of
  overwriting each other. Deletes win over a concurrent edit. Each row carries a
  client-generated UUID so an offline-created row has a stable identity before
  it ever reaches the server.

The membership check is also offline-tolerant: it falls back to the last-known
verdict cached per user, so a member isn't locked out with no signal. This is only
a UI gate — the server's RLS is still the real authority (see `CLAUDE.md`).

### Adding another offline table

1. Migration: create the table with a `uuid` primary key (client-supplied) and an
   `updated_at` timestamp, plus the usual RLS + `private.is_member()` policy +
   `authenticated` grants. **No `updated_at` trigger** — the client owns it for
   last-write-wins.
2. Add a `TableSpec` to `src/lib/offline/specs.ts` (and to `ALL_SPECS`), and list
   it in the `specs` of the module that owns it (`src/apps/<id>/index.ts`).
3. Add a thin typed hook (see `useShoppingList` / `useChores`) over
   `useOfflineTable`. No new sync code needed.

### Adding a column to an existing offline table

1. Migration: `alter table ... add column`. The column must be **nullable or have
   a default** — the engine mirrors the change into each client's local SQLite via
   `ADD COLUMN`, which SQLite only allows under that rule. No new RLS/grant: a
   column inherits the table's.
2. Add the column to the table's `TableSpec.columns`. The engine creates it for new
   clients and `ALTER`s it into existing local databases on next load; sync carries
   it automatically.
3. If you **backfill** existing rows, bump their `updated_at` in the same migration
   so the value reaches already-synced clients (their last-write-wins pull only
   takes a strictly newer row). Run it once every device has synced, so no unsynced
   offline edit predates the bump. (See `20260625000000_shopping_position.sql`.)

### Caveats

- **Last-write-wins** is per-row by client clock. Fine for 1–2 users; clock skew
  could in theory misorder near-simultaneous edits on different devices. Deletes
  are unconditional ("delete wins"), so deleting an item another device just
  edited removes it.
- **One tab at a time.** The SAH-pool VFS allows a single connection per browser,
  so only one tab uses the local database; a second tab shows an "already open in
  another tab" notice (close it and reload to take over). No data is lost — every
  tab still reconciles through the server.
- **OPFS sync access handles** (what the SAH-pool VFS uses) need Chrome/Android or
  desktop Firefox ≥ 111 — both target browsers qualify.
- Local data is wiped on sign-out (shared-device hygiene).

## Tareas

Tasks live in the `chores` table (offline-synced like the others): a title, an
optional due date (`due_on`, a plain date) and optional notes. On the list the
check circle is the only thing that marks a task done — the rest of the row
opens it at `/tareas/:id`, where every field is edited and the task can be
deleted behind a confirmation. Marking one done shows a brief undo bar. Done
tasks stay under "Hechas" until deleted from their page. Due dates are shown
the way a person says them (`relativeDay` in `src/utils/dateUtils.ts`): "hoy",
"mañana", the weekday alone up to six days out, "hace N días" for a recent
overdue, and the spelled date beyond that. A new task has no due date unless
one of the quick chips (Hoy · Mañana · calendar) is tapped.

## Fechas

Dates are calendar entries — birthdays, appointments, renewals — kept in the
`dates` table (offline-synced like the others). A date is not a task: nothing is
ever "done". `occurs_on` is the **anchor** the user entered and the app never
rewrites it; for a repeating entry (yearly, or every N months) the next
occurrence is computed on read from the anchor, so a birthday rolls over by
itself with zero writes. A one-off whose day has passed sits under "Pasadas"
until it is deleted. Each entry has a notice window (`notice_days`) that decides
how far ahead it appears in the home screen's "Próximo" list.

## Recetas

Recipes are markdown documents in the `recipes` table (offline-synced like the
others): a title, an optional time and number of servings, and a body in the
dialect below. A recipe is created with only its title and written afterwards in
a plain textarea. An `:::ingredients` block in the body renders as a tickable
list on the recipe page; each row can be sent to the shopping list, and one
button sends everything not ticked. Ticks are a reading aid for the current
session and are never saved.

## Documentos

Documents — a passport, an ID, an insurance policy — live in the `documents`
table (offline-synced like the others): a title, an optional expiry
(`expires_on`) and its notice window (`notice_days`). The content is the
document's attachments (see Adjuntos): the pictures or PDFs of it, encrypted on
the device. Deliberately nothing else is typed in, so a number or a date of
birth never reaches the server in the clear. A document is created with only
its title and opened at once to attach its files. The list is alphabetical with
the expiry under the title ("vence 14/02/2027", "venció" once past). A document
with an expiry shows in Próximo from `notice_days` ahead (up to six months, the
margin a passport often needs) and stays there once expired, until the expiry is
updated or cleared. Every document's files are kept on every device, so a
document can be seen with no connection wherever it was added.

## Markdown dialect

Guide chapters and recipe bodies share one reader (`src/components/Markdown.tsx`):
CommonMark + GFM tables, plus these
[remark-directive](https://github.com/remarkjs/remark-directive) forms mapped to
components:

- `::image{key="…" width="60" align="center"}` — an image by key, width as a
  percentage of the column. Only guides can resolve one (they own an image
  cache); anywhere else it renders nothing.
- `::youtube{id="…" start="0"}` — an embed; a plain link when offline.
- `:spoiler[text]` — tap to reveal.
- `:::ingredients` … `:::` — a markdown list (`-`, `*` or `1.`) inside; each
  item becomes a tickable row with an "add to Compras" button. Inline markup in
  an item is flattened to plain text; anything that isn't a list item is
  ignored.

Links to other guides or chapters are ordinary relative links
(`/guias/<guide>/<chapter>`).

## Adjuntos

A chore or a document can carry attachments — pictures and PDFs, up to
`ATTACHMENT_MAX_BYTES` each — that are encrypted on the device before they
leave it, so the server only ever stores ciphertext.

- **Tables and bucket**: `attachments` (owner, optional name, mime, size, the
  wrapped file key) is an ordinary offline-synced table; the file bytes live in
  the private `attachments` storage bucket under the row's id, and on the device
  in the local-only `attachment_files` table (a file added here waits there
  until uploaded; one opened here is kept for offline reading). Files are
  immutable: only the name can change, a different file is a new attachment.
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
- **In the app**: an entry's edit form shows its attachments as a grid; Agregar
  asks the device for a file (on a phone: the camera, the photos or a PDF, each
  through its own picker), then a screen that names the file. The grid,
  the viewer and the naming screen are shared (`src/components/Attachment*`);
  each app's attachment routes are thin wrappers naming the entry in the URL
  as the owner. A chore with attachments carries the same mark as one with
  notes. Opening an attachment
  shows it (an image inline, a PDF as an icon) with Compartir / Descargar / Abrir
  to get it out through the device's share sheet or, on desktop, a download or a
  new tab. A file added offline shows a cloud until it reaches the server.
- **Sync**: files follow every table sync (`afterSync`, registered in
  `src/App.tsx`): uploads go out, files of deleted rows are dropped, every
  document's files this device lacks are fetched and kept, and bucket objects
  that no row refers to and are older than an hour are removed. A file the bucket refuses for good (too large,
  wrong type) is marked failed and not retried.

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
npm run dev
```

The app won't authenticate until you wire up a Supabase project (below).

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
