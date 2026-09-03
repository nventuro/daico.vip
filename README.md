# Daico

A private household app: what the household has to do, buy, remember, keep and
pay. All data is sensitive and strictly gated behind Google sign-in — only
allowlisted accounts can see or change anything.

## Stack

React + TypeScript + Vite · Tailwind CSS v4 · Supabase (Postgres + Google OAuth) ·
GitHub Pages · a Cloudflare Email Worker for the one thing that arrives by mail.

## Shell and modules

Daico is one app made of several small ones. The **shell** (`src/shell/`) owns
sign-in, membership, the home screen (a grid of app tiles) and the per-app frame
(a header with the app's name in its colour and an arrow one level up, which
steps back to that screen when it is behind rather than stacking it on; the
wordmark «daico» is the way home). Each
feature is a **module** in `src/apps/<id>/` — its pages, hooks and the offline
tables it owns — described by an `AppModule` object (contract in
`src/apps/types.ts`) and listed in `src/apps/registry.ts`. The router and the
home screen are built from the registry; its order is the tile order.

Three screens are the shell's rather than any app's. **Buscar** (the magnifier
in the header) searches every app at once, offline: a module takes part by
exporting a `search(query)` adapter over its own local store, and the hits are
grouped by app in registry order. **Próximo** is the home screen's list of what
is coming up, every module's `useUpcoming()` entries merged soonest-first, with
«Ver todo» opening the whole list. **Ajustes** (the gear) is what this device
has to say about itself — when it last synced, what it still has to push, what
the server has refused, how much room it takes, which build it runs — and where
to sign out, which leaves the device with nothing.

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
local database and the network happens in the background. Three pieces make
this work:

- **PWA / service worker** (`vite-plugin-pwa`). The first online visit precaches
  the app shell, SQLite WebAssembly included, so the app opens and runs with no
  network, and it installs to the home screen. A new build is downloaded whole
  and then waits: it goes in at boot or when the app leaves the screen, never
  over a page that is running, and whoever never puts the app down is told on
  the home screen (`src/lib/appUpdate.ts`). The app can therefore be a version
  behind the database for a session, which costs nothing while a migration
  only adds; a column is dropped one deploy after the code stopped reading it.
- **Local SQLite** (`src/lib/offline/`). [SQLocal](https://sqlocal.dev) runs
  SQLite in a Web Worker, persisted to the browser's OPFS through the SAH-pool
  VFS — the header of `sahpoolWorker.ts` says why that one and not the default.
  It allows a single connection per browser, so one tab owns the database and a
  second shows an "already open in another tab" notice. `engine.ts` is what the
  UI reads and writes.
- **Sync engine** (`sync.ts`). On load, on reconnect, on app focus and after
  every local change it pushes what is queued and pulls the server's state.
  Rows carry a client-generated UUID, so one created offline has its identity
  before it reaches the server, and conflicts are **last-write-wins** by an
  `updated_at` set at edit time and enforced on both sides; a delete wins over
  a concurrent edit. A row the server refuses for good is skipped, so it does
  not hold up its table, and shown in Ajustes.

The membership check is offline-tolerant too: the verdict cached per user
answers first and the live read then confirms or revokes it, so no signal never
locks a member out. This is only a UI gate — the server's RLS is the real
authority (see `CLAUDE.md`). Local data is wiped on sign-out.

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
2. Add the column to the table's `TableSpec.columns`. The engine brings every
   local database up to the spec on next load, and sync carries the column.
3. If you **backfill** existing rows, bump their `updated_at` in the same migration
   so the value reaches already-synced clients (their last-write-wins pull only
   takes a strictly newer row). Run it once every device has synced, so no unsynced
   offline edit predates the bump. (See `20260625000000_shopping_position.sql`.)

## The apps

Every table below is offline-synced. This is what each app is for and what its
rows are; what may never change about them is in `CLAUDE.md`.

An entry is born on a form and lives on a page. The add bar's + opens the
app's creation form at `/<app>/nuevo` with the typed title, and nothing is
written until its Guardar, which opens the new entry; from then on the entry
is edited where it is read — the title is the heading, every control saves
as it changes, every free text is the shared editor saving a moment after
typing stops and on leaving — and deleted from the trash in its head, behind
a question. Compras is the one exception, and Recetas is not there yet.

**Tareas** — `chores`: a title, an optional due date and comments. A chore can
repeat, and marking one that does moves its date on instead of finishing it.
Born on a form with its day, its repetition and its comments; edited in place
on its page.

**Compras** — `shopping_items`: a name, whether it is in the cart, and a
fractional `position`, so reordering the list writes one row. Items are born
from the bar and live in the list; there is no page.

**Fechas** — `dates`: birthdays, appointments, renewals. Nothing is ever done:
`occurs_on` is the anchor the user entered, a repeating entry's next occurrence
is computed from it on read, and it reaches Próximo the week before. Born on a
form with its day, repetition and comments; edited in place on its page.

**Recetas** — `recipes`: a title, an optional time and number of servings, and
a markdown body in the dialect below, whose `:::ingredients` block is a
tickable list that can be sent to Compras. Still born from the bar and written
on a form of its own, until the editor has an ingredients block; deleted from
its page.

**Documentos** — `documents`: a title, an optional expiry and its notice
window. The content of a document is its files — pictures, PDFs — encrypted on the device;
nothing else is typed in, so a number or a date of birth never reaches the
server in the clear. Every document's files are kept on every device. Born on
a form with its expiry and notice; its files are added on its page, where
the rest is edited in place.

**Gastos** — `statements`, read on the device from the PDF the bank sends (one
parser per layout in `src/apps/gastos/parsers/`; the PDF is never kept). The
row keeps in the clear only what lists it — the layout, its closing and due
dates, its two totals, whether it was paid — while every purchase and
installment travels in `payload`, gzipped and encrypted under the household key
like an attachment's file. Purchases are filed into a fixed set of categories
on display, by `merchant_rules`, an encrypted pattern each. A statement is born
from its PDF and deleted from its page.

**Salud** — `checkups` and `health_records`, each row one member's and hidden
from the others by the server. A checkup is a health check to have done — a
chore that always comes back from the day it was marked, or a one-off
appointment — with comments and no attachments; it reaches Próximo the week
before. A health record is a study kept: a title, the day it was done and its
files, which hold everything the study says. Both are born on one form,
where the kind is chosen, and edited in place on their page.

**Notas** — `notes`: a title and a markdown body that never reaches the server
in the clear — the row is a title, two timestamps and an opaque blob, which is
why Buscar matches a note's title and nothing else. Born on a form with its
text; written on its page, the title on blur and the text as it goes.

**Ideas** — `ideas`: a title, the group it is filed under (`group_name`, plain
text such as «comer» or «películas») and a markdown body, all in the clear like
a recipe. A group is not a table: it is whatever ideas name it, and goes when
the last of them does. Born on a form with its group and text; edited in place
on its page, the group a chip under the title.

**Viajes** — `trips` (a title and its days, both optional) and `trip_items`,
every row of a trip in one table told apart by `kind`: a pendiente to resolve
before leaving, or a pasaje, an alojamiento, a reserva, a lugar. The app is for
the weeks before a trip — what is booked and what is still missing — and,
during it, for looking up a code or an address; it is not an agenda. A
confirmation email forwarded to the household's address becomes staged rows in
`trip_inbox`, by the worker in `worker/`, and the app shows them under Inbox to
be added to a trip or discarded. A trip and each of its rows are born on a
form — a row's class is chosen there and never changed — and edited in place
on their pages; deleting a trip takes its rows with it.

**Guías** — `guides` / `guide_chapters`: imported content (see Guides below),
in the same markdown dialect. A guide is shelved under a group (`group_name`,
as an idea is) and can be archived out of the list; that much is the
household's to change, the contents are the import's. There is no form and
no delete: the title and the group are edited in place on the guide's page.

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

The editor (`src/components/editor/`) writes the same dialect and draws it with
the reader's own classes, so a body looks the same read or written. It does
not model GFM tables or the directives: they stay as the text they are, and
are kept unchanged unless written on.

## Adjuntos

A chore, a document, a note, an idea or a row of a trip can carry attachments —
pictures and PDFs — that are encrypted on the device before they leave it, so
the server only ever stores ciphertext.

- **Tables and bucket**: `attachments` (owner, optional name, mime, size, the
  wrapped file key) is an ordinary offline-synced table; the bytes live in the
  private `attachments` bucket under the row's id, and on the device in a
  local-only table. A file is immutable: a different picture is a new
  attachment.
- **Keys**: a six-word phrase (from the BIP-39 Spanish list) derives the key
  that wraps the household's master key, stored wrapped in `household_key`; the
  master key wraps one key per file; the file key encrypts the file with
  AES-GCM. A device unwraps the master key once, when the phrase is typed, and
  keeps it non-extractable in IndexedDB. The phrase exists only on paper:
  losing it loses every attachment.
- **The phrase gate**: a device without the master key stops right after login,
  before the home screen, and asks for the phrase. The very first time (no
  `household_key` row yet) the app generates the phrase and asks for it to be
  written down. Signing out forgets the key.
- **In the app**: an entry's page shows its attachments as a grid. Agregar
  asks for pictures or a PDF, each through the device's own picker — on a
  phone, the photo picker for pictures and the file chooser for a PDF — and
  each file picked goes through the add dialog: a picture cropped and turned
  if wanted, a PDF as it is, with an optional name. A tile opens the lightbox;
  a PDF is drawn there page by page (its first page is its tile) and only
  leaves the app through Compartir / Descargar.
- **Sync**: files follow every table sync — uploads go out, files of deleted
  rows are dropped, every document's files this device lacks are fetched and
  kept, and bucket objects no row refers to are swept.

## Guides

Guides are reference documents (a guide → sections → chapters) that members
can read offline. Their contents come from an import script and are only read
in the app; what the household decides about a guide — its title, the group
it is shelved under and whether it is archived — is edited in the app.

- **Tables**: `guides` and `guide_chapters` are ordinary offline-synced tables,
  so chapters read with no connection. `guide_images` is **not** synced — images
  are too large to pull wholesale on every sync — so the app fetches each image
  the first time a chapter needs it and keeps it in a local-only cache.
  `guide_chapters` and `guide_images` are `select`-only for `authenticated`;
  `guides` also takes `insert` and `update` — never `delete`, a guide is only
  removed by the import.
- **The list** groups guides by `group_name` (dividers in name order, as
  Ideas), with the archived ones under a collapsed «Archivadas» at the foot.
  Buscar leaves archived guides and their chapters out.
- **Chapter bodies** are written in the markdown dialect above.

### Importing guides

```
npm run guides:import -- --dump <dir> [--group <name>] [--dry-run] [--preview <dir>]
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

A guide is shelved under the author the dump names, or under `--group` for the
whole dump. Ids derive from the source identifiers (UUID v5), so re-running the
import replaces a guide's description, chapters and images while keeping every
id — clients update in place via the normal sync and links keep working — and
keeps the title, group and archived flag a guide already has, since those are
the household's. `--dry-run` skips the database;
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
app won't authenticate until you wire up a Supabase project (below).

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
  (The email worker adds two more; see step 5.)

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

### 5. The email worker (Correo a Viajes)

The worker in `worker/` is deployed to Cloudflare on its own; the app's deploy
does not touch it. It needs two more lines in `.env`: `CLOUDFLARE_API_TOKEN`
(template "Edit Cloudflare Workers", plus **Hyperdrive: Edit** and **SSL and
Certificates: Edit** on the account) and `ANTHROPIC_API_KEY` (a key from a
workspace of its own, with a spend limit). Then, in order:

```bash
npm run worker:cert                            # uploads supabase/ca.crt, prints a certificate id
npm run worker:hyperdrive -- <certificate id>  # sets the role's password, creates the Hyperdrive config, writes its id into worker/wrangler.jsonc
npm run worker:deploy                          # creates the worker; the binding has to exist first
npm run worker:secret                          # puts ANTHROPIC_API_KEY on it
```

Then, in the Cloudflare dashboard → Email Routing → Email addresses, create the
household's address with the action «Send to a Worker» → `trips-inbox`.
`npm run worker:tail` follows the log; the first real forward is the test.
Rotating the role's password is `npm run worker:hyperdrive` again, and every
change to the worker is `npm run worker:deploy` again.
