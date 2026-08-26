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

Chores and the shopping list work with **no connection** — you can open the app,
add, check off, and delete items offline (e.g. at a shop with no signal), and it
all syncs automatically once you're back online. There's no spinner on any
action: the UI reads and writes a local database and the network happens in the
background.

Three pieces make this work:

- **PWA / service worker** (`vite-plugin-pwa`). The first online visit precaches
  the app shell — including the ~1.5 MB SQLite WebAssembly — so the app *opens and
  runs* with no network. Installable ("Add to Home Screen") for a fullscreen,
  app-like launch. GitHub Pages serves it over HTTPS, which service workers
  require; no custom headers are needed (see the SQLite note below).

- **Local SQLite** (`src/lib/offline/`). [SQLocal](https://sqlocal.dev) runs SQLite
  in a Web Worker, persisted to the browser's [OPFS](https://developer.mozilla.org/en-US/docs/Web/API/File_System_API/Origin_private_file_system).
  It uses the **OPFS SAH Pool VFS**, which (unlike the default OPFS VFS) needs no
  `SharedArrayBuffer` and therefore no `COOP`/`COEP` response headers — important
  because **GitHub Pages can't set custom headers**. `engine.ts` is the source of
  truth the UI reads/writes; every change is instant and offline-safe.

- **Sync engine** (`src/lib/offline/sync.ts`). On load, on reconnect, and on app
  focus it pushes queued local changes and pulls the server state. Conflicts use
  **last-write-wins** by an `updated_at` timestamp set at edit time; deletes win
  over a concurrent edit. Each row carries a client-generated UUID so an
  offline-created row has a stable identity before it ever reaches the server.

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
- **OPFS** needs a modern browser (Chrome/Android, or iOS Safari ≥ 16.4).
- Local data is wiped on sign-out (shared-device hygiene).

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
- **Chapter bodies** are markdown: CommonMark + GFM tables, plus three
  [remark-directive](https://github.com/remarkjs/remark-directive) forms the
  reader (`src/apps/guias/`) maps to components:
  `::image{key="…" width="60" align="center"}` (an image by key, width as a
  percentage of the column), `::youtube{id="…" start="0"}` (embed; a plain link
  when offline) and `:spoiler[text]` (tap to reveal). Links to other guides or
  chapters are ordinary relative links (`/guias/<guide>/<chapter>`).

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