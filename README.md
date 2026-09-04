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
(a header with the app's name in its colour and an arrow one level up; the
wordmark «daico» is the way home). Each feature is a **module** in
`src/apps/<id>/` — its pages, hooks and the offline tables it owns — described
by an `AppModule` object (contract in `src/apps/types.ts`) and listed in
`src/apps/registry.ts`. The router and the home screen are built from the
registry; its order is the tile order.

Three screens are the shell's rather than any app's. **Buscar** (the magnifier
in the header) searches every app at once, offline: a module takes part by
exporting a `search(query)` adapter over its own local store, and the hits are
grouped by app in registry order. **Próximo** is the home screen's list of what
is coming up, every module's `useUpcoming()` entries merged soonest-first, with
«Ver todo» opening the whole list. **Ajustes** (the gear) is what this device
has to say about itself, and where to sign out, which leaves the device with
nothing.

### Adding an app

1. Create `src/apps/<id>/index.ts` exporting an `AppModule`: `id`, `name`,
   `icon`, the `TableSpec`s it owns and its `routes` (relative to `/<id>`, pages
   `lazy()`-loaded at module scope).
2. Add the id to `APP_IDS` in `src/apps/types.ts`, a `--color-app-<id>` token
   to the `@theme static` block in `src/index.css` and the app's motif to
   `MOTIFS` in `src/components/Motif.tsx` — an app's colour is its id, and a
   test checks the registry and the theme against that one list.
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
  network, and it installs to the home screen. A new build waits until the app
  is not running before it goes in (`src/lib/appUpdate.ts`), so the app can be
  a version behind the database for a session.
- **Local SQLite** (`src/lib/offline/`). [SQLocal](https://sqlocal.dev) runs
  SQLite in a Web Worker, persisted to the browser's OPFS through the SAH-pool
  VFS — the header of `sahpoolWorker.ts` says why that one and not the default.
  It allows a single connection per browser, so one tab owns the database at a
  time. `engine.ts` is what the UI reads and writes.
- **Sync engine** (`sync.ts`). On load, on reconnect, on app focus and after
  every local change it pushes what is queued and pulls the server's state.
  Rows carry a client-generated UUID, so one created offline has its identity
  before it reaches the server, and conflicts are **last-write-wins** by an
  `updated_at` set at edit time and enforced on both sides; a delete wins over
  a concurrent edit. A row the server refuses for good is skipped, so it does
  not hold up its table, and shown in Ajustes.

The membership check is offline-tolerant too: the verdict cached per user
answers first and the live read then confirms or revokes it, so no signal never
locks a member out; the server's RLS is the real authority either way. Local
data is wiped on sign-out.

### Adding another offline table

1. Migration: create the table with a `uuid` primary key (client-supplied) and an
   `updated_at` timestamp, plus the usual RLS + `private.is_member()` policy +
   `authenticated` grants and the `private.last_write_wins()` trigger every synced
   table has. `db:verify` checks all of it.
2. Add a `TableSpec` to `src/lib/offline/specs.ts` (and to `ALL_SPECS`), and list
   it in the `specs` of the module that owns it (`src/apps/<id>/index.ts`).
3. Add a thin typed hook (see `useShoppingList` / `useChores`) over
   `useOfflineTable`. No new sync code needed.

### Adding a column to an existing offline table

1. Migration: `alter table ... add column`, with a default if it is `not null`.
   No new RLS/grant: a column inherits the table's.
2. Add the column to the table's `TableSpec.columns`. The engine brings every
   local database up to the spec on next load, and sync carries the column.
3. If you **backfill** existing rows, bump their `updated_at` in the same migration
   so the value reaches already-synced clients (their last-write-wins pull only
   takes a strictly newer row). Run it once every device has synced, so no unsynced
   offline edit predates the bump. (See `20260625000000_shopping_position.sql`.)

## The apps

Every table below is offline-synced. This is what each app is for and what its
rows are; what may never change about them is in `CLAUDE.md`.

An entry is born from the bar and lives on a page. The add bar's + writes the
row with the typed title and nothing else decided, and opens it; from then on
the entry is edited where it is read, every control saving as it changes, and
deleted from the trash in its head, behind a question. Where one thing about
an entry can never be changed once it exists, the + asks it first. The square
that marks a chore, a checkup or a pendiente is the one control that leaves a
page: it does what the list's square does and goes back to where the page was
opened from. How far ahead a dated entry reaches Próximo is one window per
app, a constant of the app's, never the entry's. Each app below says only
where it departs from this.

**Tareas** — `chores`: a title, an optional due date and comments. A chore can
repeat, and marking one that does moves its date on instead of finishing it.

**Compras** — `shopping_items`: a name, whether it is in the cart, and a
fractional `position`, so reordering the list writes one row. Items live in the
list; there is no page.

**Fechas** — `dates`: birthdays, appointments, renewals. Nothing is ever done:
`occurs_on` is the anchor the user entered, and a repeating entry's next
occurrence is computed from it on read. Born on today.

**Recetas** — `recipes`: a title, an optional time and number of servings, and
a markdown body in the dialect below, whose `:::ingredients` block is a
tickable list that can be sent to Compras. Still written on a form of its own,
until the editor has an ingredients block.

**Documentos** — `documents`: a title and an optional expiry. The content of a
document is its files — pictures, PDFs — encrypted on the device; nothing else
is typed in, so a number or a date of birth never reaches the server in the
clear. Every document's files are kept on every device.

**Gastos** — `statements`, read on the device from the PDF the bank sends (one
parser per layout in `src/apps/gastos/parsers/`; the PDF is never kept). The
row keeps in the clear only what lists it — the layout, its closing and due
dates, its two totals, whether it was paid — while every purchase and
installment travels in `payload`, gzipped and encrypted under the household key
like an attachment's file. Purchases are filed into a fixed set of categories
on display, by `merchant_rules`, an encrypted pattern each. A statement is born
from its PDF, not the bar. Próximo lists every statement still to be paid, and
a statement that is late to be imported.

**Salud** — `checkups` and `health_records`, each row one member's and hidden
from the others by the server. A checkup is a health check to have done — a
chore that always comes back from the day it was marked, or a one-off
appointment — with comments and no attachments. A health record is a study
kept: a title, the day it was done and its files, which hold everything the
study says. Both are born from one bar, whose + asks which of the two.

**Notas** — `notes`: a title and a markdown body that never reaches the server
in the clear — the row is a title, its timestamps and a sealed body, which is
why Buscar matches a note's title and nothing else.

**Ideas** — `ideas`: a title, the group it is filed under (`group_name`, plain
text such as «comer» or «películas») and a markdown body, all in the clear like
a recipe. A group is not a table: it is whatever ideas name it, and goes when
the last of them does; an idea can also be filed under none, and those are
listed ahead of the groups. Born in the group of the idea last written on.

**Viajes** — `trips` (a title and its days, both optional) and `trip_items`,
every row of a trip in one table told apart by `kind`: a pendiente to resolve
before leaving, or a pasaje, an alojamiento, a reserva, a lugar. The app is for
the weeks before a trip — what is booked and what is still missing — and,
during it, for looking up a code or an address; it is not an agenda. A row's
kind is asked by the + and never changed, only a pendiente is ever ticked, and
deleting a trip takes its rows with it. A forwarded confirmation email becomes
staged rows in `trip_inbox`, shown under Inbox to be added to a trip or
discarded (Correo a Viajes below).

**Guías** — `guides` / `guide_chapters`: imported reference documents — a guide,
its sections, their chapters — in the same markdown dialect (Importing guides
below). A guide is shelved under a group (`group_name`, as an idea is) and can
be archived out of the list; that much is the household's to change, the
contents are the import's, and there is no delete. `guide_images` is not
synced — images are too large to pull wholesale on every sync — so the app
fetches each image the first time a chapter needs it and keeps it in a
local-only cache.

## Markdown dialect

Every body — a guide's chapters, a recipe, a note, an idea, an entry's
comments — is read by one reader (`src/components/markdown/`): CommonMark + GFM
tables, plus these
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

Links to other guides or chapters are ordinary relative links
(`/guias/<guide>/<chapter>`).

The editor (`src/components/editor/`) writes the same dialect and draws it with
the reader's own classes, so a body looks the same read or written.

## Adjuntos

A chore, a document, a note, an idea, a study or a row of a trip can carry
attachments — pictures and PDFs — that are encrypted on the device before they
leave it, so the server only ever stores ciphertext.

- **Tables and bucket**: `attachments` is an ordinary offline-synced table that
  carries the wrapped file key; the bytes live in the private `attachments`
  bucket under the row's id, and on the device in a local-only table. A file is
  immutable: a different picture is a new attachment.
- **Keys**: a six-word phrase derives the key that wraps the household's master
  key, stored wrapped in `household_key`; the master key wraps one key per file;
  the file key encrypts the file with AES-GCM. A device unwraps the master key
  once, when the phrase is typed, and keeps it non-extractable in IndexedDB. The
  phrase exists only on paper: losing it loses every attachment.
- **The phrase gate**: a device without the master key stops right after login,
  before the home screen, and asks for the phrase. The very first time (no
  `household_key` row yet) the app generates the phrase and asks for it to be
  written down. Signing out forgets the key.
- **In the app**: an entry's page shows its attachments as a grid, and a PDF is
  drawn in the app, never handed to the system.
- **Sync**: files follow every table sync — uploads go out, files of deleted
  rows are dropped, and the files every device keeps — every document's, and a
  trip's until a week past its last day — are fetched. Everything else is
  fetched on demand, and «Liberar espacio» in Ajustes lets a past trip's go.

## Correo a Viajes

A confirmation email forwarded to the household's address reaches the worker in
`worker/` (its header says what it holds and why). It lets through only mail
from a member, has a model read the bookings out of it, and stages one row per
booking in `trip_inbox`, always replying to the sender. The PDFs the email
carries are staged beside the rows in `trip_inbox_files`, sealed to the
household's inbox key: a pair in `inbox_key` whose public half the worker seals
to and whose private half is sealed under the master key like any file, so the
worker never holds anything that opens one. Every device fetches the staged
files after a sync, so a group is confirmed with no connection; confirming
makes the rows a trip's and the PDFs their attachments, and discarding drops
both.

## Importing guides

```
npm run guides:import -- --dump <dir> [--group <name>] [--dry-run] [--preview <dir>]
```

The dump is the source site's export, kept **outside the repo** — it's private
content; the header of `scripts/import-guides.mjs` says what it holds and what
becomes of it. Everything source-specific stays in the importer, and the app
only knows the dialect above. Ids derive from the source identifiers (UUID v5),
so re-running the import replaces a guide's description, chapters and images
while keeping every id — clients update in place via the normal sync and links
keep working — and keeps the title, group and archived flag a guide already
has, since those are the household's. A guide is shelved under the author the
dump names, or under `--group` for the whole dump.

## Local development

```bash
npm install
npm run dev          # dev server
npm test             # the whole suite once (npm run test:watch to keep it running)
npm run lint
npm run format       # format:check only reports
npm run build        # tsc -b + the production build
npm run preview      # serves the build, the one place the CSP is live locally
npm run worker:test  # the email worker's tests and type check
```

The tests run on real SQLite in-process and a stand-in for the server, so they
need nothing running; CI runs the app's four checks on every push to `main`,
not the worker's. The app won't authenticate until you wire up a Supabase
project (below).

## First-time setup

### 1. Create the Supabase project

- Create a project at [supabase.com](https://supabase.com).
- Copy the project URL and the **publishable** key (`sb_publishable_...`) from
  Project Settings → API Keys into `src/config.ts`.
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
