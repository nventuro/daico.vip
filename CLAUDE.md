# Daico

Private household app — what the household has to do, buy, remember, keep and
pay — backed by Supabase. Access is restricted to a fixed allowlist of
authorized users. All data is sensitive and strictly access-gated.

## Target platform

Supported browsers are **Android mobile (Chromium-based)** and **desktop Firefox
(Gecko)**. iOS and Safari are out of scope — a feature unsupported only on
Safari/iOS is not a blocker. The two supported engines differ, so don't assume
Chromium-only APIs are available everywhere.

## Security model — read this first

- **Everything is gated behind `private.is_member()`.** Every table has RLS enabled
  and a policy of the form
  `to authenticated using (private.is_member()) with check (private.is_member())`.
- **`private.is_member()` binds membership to a verified Google identity**, not to
  the raw JWT `email` claim: it returns true only when the calling user
  (`auth.uid()`) has a row in `auth.identities` with `provider = 'google'` whose
  email is in `members` (case-insensitive). This means a non-Google credential
  (e.g. an email/password account registered for a member's address) can never
  pass, regardless of which auth providers happen to be enabled. The Email auth
  provider is also disabled in the dashboard (Google-only) — keep it that way.
- **Never add an anon grant or a public view.** There is no public data. The anon
  role must always resolve to zero access. Note: Supabase's project-level default
  privileges silently grant `anon`/`authenticated` extra privileges (TRUNCATE,
  REFERENCES, TRIGGER, MAINTAIN) on every new `public` table — migrations don't see
  this. `20260622020000_harden_security.sql` revokes them and `ALTER`s the
  `postgres` default privileges so future tables stay clean; the per-table `grant`
  below must still re-grant the exact set `authenticated` needs.
- Membership is an allowlist: the `members` table holds the authorized Google
  account emails. A signed-in account that is not a member is fully fail-closed
  (sees nothing, can write nothing) and gets the "Sin acceso" screen. The client
  detects membership by reading `members` (members see rows, non-members see none),
  not via an RPC.
- **Every new table must, in the same migration: (1) enable RLS, (2) add a
  `private.is_member()` policy, AND (3) `grant` the needed privileges to
  `authenticated`** (e.g. `grant select, insert, update, delete on public.<table>
to authenticated`). RLS is a _filter on top of_ SQL privileges, not a
  replacement: a role with a policy but no GRANT gets "permission denied for
  table ..." before the policy is ever evaluated. **Never grant to `anon`** —
  anon must stay fully locked out.
- SECURITY DEFINER helpers used by RLS live in the **non-exposed `private` schema**
  (e.g. `private.is_member()`), never in `public` — a SECURITY DEFINER function in
  `public` is callable by anyone via the PostgREST `/rpc` API (the security advisor
  flags this). They must always `set search_path = ''` and use fully qualified
  names (e.g. `public.members`).
- **The built page carries a Content-Security-Policy** (a `<meta>` injected by
  `vite.config.ts` at build; the static host can't set headers). Scripts run
  only from the page's own origin and may only talk to Supabase. Anything the
  app loads from a new origin (a font host, an embed) must be added there or the
  browser blocks it; `npm run preview` is where the policy is live locally.
- **`npm run db:verify` asserts these invariants against the live database**
  (RLS on every public table, an `is_member()` policy on each, zero anon
  privileges, no SECURITY DEFINER function or view in `public`, etc.) and fails on
  any drift. It runs automatically after `npm run db:push`. Run it after any schema
  change; if you add an invariant, add a check in `scripts/verify-db-security.mjs`.

## Offline-first model — read before touching data tables

- **Every data table is offline-first.** The README has the architecture; this
  section is the rules on top of it.
- **Every offline-synced table must have a client-supplied `uuid` primary key and
  an `updated_at timestamptz`.** The UUID gives an offline-created row a stable
  identity before it reaches the server (never `generated always as identity` for
  these). `updated_at` is the **last-write-wins key and is client-owned** — set at
  edit time and sent by the client. **Never add a trigger that bumps `updated_at`
  on update**: a server-side bump would use sync time and break LWW ordering for
  edits made offline. The one trigger every synced table **must** have is
  `private.last_write_wins()` (`before update`, see
  `20260827040000_last_write_wins.sql`): it skips an update carrying an older
  `updated_at` than the stored row, so a stale offline edit can't overwrite a
  newer one on push and devices converge. `db:verify` checks every table with
  `updated_at` has it. The standard table/RLS/grant rules above still apply in
  the same migration.
- **A synced table is described in one place: `src/lib/offline/specs.ts`** — its
  row type (extending `SyncedRow`, which carries `id` / `created_at` /
  `updated_at`), the values any enumerated column may take, and its `TableSpec`.
  `TableSpec<Row>`'s `columns` is keyed by column name, so a column missing from
  either the row type or the spec fails to compile; a column's DDL default lives
  there too (`DATE_NOTICE_DAYS_DEFAULT`).
- **Adding one is the three steps in the README**, with `SHELL_SPECS` in place of
  a module's `specs` when no single app owns the table, as with `attachments`.
  None of the steps is sync code: **never hand-write sync or SQL** — the generic
  `engine.ts` handles CRUD, the local-only `pending_op`/`synced` bookkeeping and
  the LWW reconcile, and a thin hook over `useOfflineTable` gives the table its
  typed `insert` / `update` / `remove`. Conflict policy is last-write-wins with
  "delete wins".
- **A table that never leaves the device** (a blob cache, the engine's own
  bookkeeping) is a `LocalTableSpec` in `src/lib/offline/localTables.ts`,
  created and wiped with the rest; its rows are read and written by whoever
  owns them — the app's over the engine's `localQuery` / `localWrite`. They are
  never in `ALL_SPECS`.
- **What asks for a sync is installed once** (`installSyncTriggers`, from the
  shell's `AppProvider`, while a member is in): the connection coming back, and
  the app returning to the foreground. A table's hook only subscribes to its
  table and asks for a run when its screen opens (`syncIfStale`) — never its own
  listeners. Nothing syncs before the member is in: there is nothing to sync
  for anyone else, and a run after a sign-out would build the local store again
  right after the sign-out wiped it.
- **The engine and sync are tested against real SQLite and a stand-in server**
  (`src/lib/offline/*.test.ts`, over `testing/sqlocalInMemory.ts` and
  `testing/fakeSupabase.ts`). A change to CRUD, the sync order or the conflict
  policy must come with a test there.
- **Guides are read-only imported content** (the README says how they get in):
  the app never writes `guides` / `guide_chapters` and their grants are `select`
  only. `guide_images` is deliberately **not** in `ALL_SPECS` — the sync engine
  pulls whole tables on every sync, and images would make that pull megabytes;
  they are fetched on demand into a local-only table. Keep any large blob table
  out of `ALL_SPECS` the same way. Source-site specifics (token syntax, section
  names) belong in `scripts/import-guides/`, never in the app. **Never commit a
  guides dump** — it is private content, keep it outside the repo.
- **The local database is opened by the custom SQLocal worker in
  `src/lib/offline/sahpoolWorker.ts`, never SQLocal's default** — the worker's
  own header says why. Keep passing it as SQLocal's `processor`, **never add
  anything that needs `SharedArrayBuffer` or cross-origin isolation**, and keep
  `worker: { format: 'es' }` and
  `optimizeDeps.exclude: ['sqlocal', '@sqlite.org/sqlite-wasm']` in
  `vite.config.ts`. That VFS takes one connection per origin, which is what
  `src/lib/offline/singleTab.ts` is for; leave the lock in place.
- **A new build never replaces the one a page is running.** `registerType` is
  `'prompt'` — **never `'autoUpdate'`**, which lets a new worker seize a page
  mid-flight and leaves the running code and the cache from different builds,
  the state that breaks every `lazy()` route not yet loaded. `injectRegister` is
  `null` and `src/lib/appUpdate.ts` registers the worker itself; it is the only
  place that decides when a version goes in (boot, and the app leaving the
  screen) and the only place that talks to `navigator.serviceWorker`; a change
  to when a version goes in must come with a test in `appUpdate.test.ts`, over
  the stand-in service worker there. A pull asks for `*`, never the columns a
  spec names, so a build a migration got ahead of still brings its tables down.
- **The membership check is offline-tolerant** (`AppContext` falls back to a
  per-user cached verdict when the live read fails). This is only a UI gate — the
  server's RLS is the real authority, so a stale `true` still reads nothing and has
  every queued write rejected on sync. Don't "harden" it by removing the cache, or
  members get locked out at the "Sin acceso" screen with no signal.

## Attachments and the household key — read before touching files or keys

The README's "Adjuntos" says how this works: the key hierarchy, the phrase
gate, what a sync does with the files. These are the rules on top of it.

- **`src/lib/householdKey.ts` is the only crypto code in the app** — never add
  another. Never send, log or persist the phrase, the master key or a file key
  anywhere else: a device keeps the master key as a non-extractable `CryptoKey`
  in IndexedDB (`masterKeyStore.ts`), and `useMasterKey` is the one place the
  app reads it.
- **`household_key` is written once, directly to the server, online** (the
  first member's setup in `UnlockScreen`), never through the engine's queue: the
  unique index makes a racing second setup fail instead of leaving two keys.
  Never delete the row and never add a key-rotation path lightly — with the row
  gone or replaced, every attachment is unreadable.
- **Files travel outside the tables, through `src/lib/attachmentFiles.ts`
  only.** Attachments are pictures (`ATTACHMENT_FILE_TYPES`) and their blobs are
  immutable: replacing one is a new attachment. The `attachments` row is an
  ordinary synced table shared by every app whose entries take pictures
  (`owner_kind`), so it lives in `SHELL_SPECS` and is drawn by the shared
  `src/components/Attachment*`, parametrized by the owner. There is no
  attachment page: an entry's route ends in an optional `:attachmentId`, so a
  picture has a URL of its own.
- **Two rules the `afterSync` work turns on.** Keeping every **document's**
  files on every device is the one exception to files being fetched on demand:
  never extend it to another owner kind, never pull files wholesale, and never
  put them in `ALL_SPECS`. The orphan sweep runs only against rows the run
  itself brought down and never against an empty table — what it cannot tell
  from an orphan is a file this device has not heard of yet, and the difference
  is every document the household has.
- **The bucket is private and gated like a table**: `storage.objects` has a
  `private.is_member()` policy scoped to the bucket, it only takes
  `application/octet-stream`, and its size limit is `ATTACHMENT_MAX_BYTES` plus
  the encryption overhead. `db:verify` checks no bucket is public, every bucket
  has such a policy, and no storage policy reaches `anon`.
- **Tests**: `householdKey.test.ts` (Node's WebCrypto) and
  `attachmentFiles.test.ts` (real SQLite + the fake server's `storage`). A
  change to the file format, the queue states or the sweep must come with one.

## Statements (Gastos) — read before touching them

The README's "Gastos" says what a statement is and what its row keeps in the
clear. These are the rules on top of it.

- **A statement's contents never reach the server in the clear.** Every purchase
  and installment lives in `payload` under its own `wrapped_key`, sealed by
  `src/apps/gastos/payload.ts` (gzip, then `encryptFile` from `householdKey.ts`
  — never other crypto); a merchant rule's `pattern` is sealed the same way.
  **Never add a column that names a merchant or an amount of a line**, and never
  log or persist opened contents outside `openOnce`'s in-memory cache. **Gastos
  contributes nothing to search** for the same reason: search reads the local
  tables as they are stored, and looking through statements would mean unsealing
  every one on every keystroke. **Who made a purchase is not kept at all**, not
  even sealed.
- **The payload is pulled with the table**, so it must stay a few KB: keep the
  compression, and keep bulky data out — no PDF is ever stored.
  `STATEMENT_CONTENTS_SCHEMA` is bumped when the sealed shape changes, and a
  build that meets a later schema refuses the row rather than reading it as an
  older one: opening it short and marking a line would reseal the loss under a
  newer `updated_at` and carry it to every device.
- **One parser per bank layout** in `src/apps/gastos/parsers/`, reading the
  positioned words `pdfWords.ts` gets from pdf.js (loaded only on import). A
  parser throws `UnknownLayout` when the pages are not its own and a
  `StatementError` (a message in the user's words) when they are but do not
  reconcile with the printed totals; an import that fails saves nothing. Column
  positions are named constants at the top of each parser.
- **Never commit a real statement**, nor a fixture derived from one: the parser
  tests build synthetic pages with the builders in `parsers/testing/` and
  invented holders. The privacy rule below applies to test data too.
- **Categories are the fixed `SPENDING_CATEGORIES`**; a new one is a new member
  plus its label in `labels.ts`. Filing is done on display by `rules.ts`, so a
  rule change refiles every statement at once. **Never add a built-in merchant
  list**: the repo is public and where the household shops is private.

## Privacy — the code is public, the data is private

- This repository is public; the database is private. **Never reference any real
  person in committed files** — no names, relationships (wife, husband, partner,
  couple, family), addresses, phone numbers, or personal emails — anywhere in code,
  comments, UI strings, README, migrations, or config.
- Keep everything generic: `member`, `user`, `household`. All personal data lives
  only in the database (e.g. the `members` table). **Migrations must never seed real
  emails or names** — add real members manually via the Supabase SQL editor.
- UI copy must be generic and non-identifying.

## Conventions

- **Code language**: all code, comments, variable names, types, and file names in English.
- **UI language**: all user-facing text in Argentinian Spanish (voseo, local expressions).
- **Styling**: Tailwind utility classes exclusively — no CSS modules or styled-components.
  Never use hardcoded Tailwind color scales (e.g. `red-400`, `teal-600`); always use the
  semantic theme tokens defined in `src/index.css` (`primary`, `error`, `muted`,
  `surface`, `surface-raised`, etc.). Add new tokens to the theme if needed.
- **Mobile-first**: phones are a primary device — design mobile-first; ensure layouts
  and interactions work well on small screens.
- **Components**: functional components with hooks, one component per file. Shared
  components live in `src/components/`, app-specific ones in `src/apps/<id>/`, and
  the shell (layout, the screens that gate it, home screen, app frame) in
  `src/shell/`.
- **One direction only** — `utils` (pure) ← `lib` (infrastructure) ← `components`
  and `hooks` (shared UI) ← `apps` (the features) ← `shell` (what mounts them).
  A layer may use everything under it and nothing over it, so a piece of one app
  can never end up wired into another's screens through a shared file.
  `src/apps/types.ts`, the contract the shell mounts an app by, is the one file
  anything may name. ESLint enforces this (`no-restricted-imports` per directory
  in `eslint.config.js`).
- **Types**: `src/types.ts` holds only what more than one part of the app agrees
  on (`SyncedRow`, `EntryMark`, `AttachmentOwner`). A synced row's type lives
  with its spec; everything else lives with whoever owns it.
- **No magic numbers**: a domain constant is named, never hardcoded, and lives with
  whoever owns it — an app's tuning in `src/apps/<id>/`, the shell's in
  `src/shell/`, a table's column default with its spec, an outside address in
  `src/config.ts`. Never a shared bag of constants.
- **Date format**: always dd/mm order, never mm/dd. Use `formatDate` (long locale) or
  `formatDateShort` (dd/mm/yyyy) from `src/utils/dateUtils.ts`. A date is picked with
  `DatePicker` (or `NativeDatePicker` behind a control of your own): a native
  `<input type="date">` prints in the browser's language. ESLint enforces both
  (`no-restricted-syntax` in `eslint.config.js`).
- **Repetition**: anything that comes back says so the same way — `repeat_every`
  and `repeat_unit` (`day`/`week`/`month`/`year`), both null or both set, on
  `chores` and `dates` alike. The arithmetic and the words for it are
  `src/utils/recurrence.ts`, under both apps because one app may not import from
  another; `nextOccurrenceOnOrAfter` derives every occurrence from the anchor
  (anchor plus k steps) rather than from the one before, so a day clamped by a
  short month never drifts. What a chore counts its next date from
  (`repeat_from`) and the day it was last marked (`last_done_on`) are its own: a
  date is never done, and a chore that repeats never is either — it is up to
  date, which is why `chores` has no `done` column.
- **Icon-only controls**: must have an accessible label (`aria-label` + `title`).
- **Screens are built from the shared pieces in `src/components/`**, never
  hand-assembled: `ListPage` (the offline notice, the error, the skeleton and
  the bar pinned at the bottom) and `EntryPage` (holds its place, says when the
  entry is not there) are the two shapes every screen takes, and everything
  that goes on them — the rows a list is made of, the fields a form is made of,
  the dialog, the bar a growing list ends in — has a component there already.
  Read the directory before writing a control; never hand-write control or
  button classes in a page, and a control with no component of its own takes
  its classes from `src/components/controlClasses.ts`. This is what keeps every
  app looking like one app.
- **Rows, not cards**: a list is plain rows separated by hairlines — on each row
  `border-b border-border`, or on the list `divide-y divide-border` — never a
  bordered box. A group of rows is headed by `SectionLabel`; a done/undone mark
  is `CheckSquare`. Corners are square everywhere — no `rounded-*`.
- **Marks on a listed entry** (has notes, repeats, ...) are declared once per app in
  `src/apps/<id>/marks.ts` (`choreMarks`, `dateMarks`) as `EntryMark[]` and drawn by
  `EntryMarks` — the app's own list passes them as `ChecklistItem`'s `trailing`, and
  its `useUpcoming` sets them on each `Upcoming`, so Próximo shows the same marks.
  Never draw an ad-hoc icon on a row: a mark that is not in `marks.ts` is missing
  from Próximo. A new kind of mark is a new `EntryMark` member plus its icon.
- **Nothing is destroyed on a single tap**: a delete goes through `FormFooter`'s
  confirm, or is reversible for a moment through `UndoBar` (`useUndo`).
- **A wait is shown, never written**: no «Cargando...» text. A list still being
  read holds its place with `SkeletonRows` in the shape of its rows; anything
  being fetched (a picture, a guide image) carries `LoadingLine`; a gate still
  resolving before the home screen (session, membership, key) renders `null`,
  which keeps the splash in `index.html` up — that splash and `LoginScreen`
  share one frame, keep them identical. A sync in progress is only ever the
  diamond beside the wordmark (`useSyncStatus`), never a line or a message.
- **No duplicated logic**: extract shared computation; check for existing helpers first.
- **The suite passes**: run `npm test` after changes; CI runs it on every push to
  `main`.
- **Zero lint errors**: run `npm run lint` after changes and fix everything before done.
- **Prettier-formatted**: run `npm run format` after changes; CI fails on an unformatted
  file (`npm run format:check`). Tailwind classes are sorted by the Prettier plugin.
- **Zero build warnings**: run `npm run build` after changes and fix everything before done.

## App modules

The README says what a module is and how to add one. The rules:

- The contract (`src/apps/types.ts`), the registry and module files
  (`src/apps/<id>/index.ts`) are `.ts`, not `.tsx`: routes use `Component:` and
  pages are `lazy()`-loaded at module scope only — never call `lazy()` inside a
  component.
- Module routes are relative to `/<id>`; in-app links are absolute
  (`/guias/...`). A module never imports `registry.ts`.
- Per-app colour comes from the `--app` CSS variable the shell sets via
  `hueStyle`; utilities read it as `bg-(--app)` / `text-(--app)`. **Never build a
  class name from data** (no `bg-${hue}`).
- Pages don't render the app's title or a back link — the shell's app frame does.
- `useUpcoming` and `search` on a module are optional adapters; a module without
  them simply doesn't contribute to Próximo or search (say why in the module
  when it is deliberate). `search(query)` is a plain async function (not a hook)
  over the module's local store — `searchTable(spec, query, …)`, which also
  finds the entries' attachments — never a network call, so search works
  offline; how many results an app contributes is capped once, in the shell. An
  entry's URL is `entryPath(appId, id)`, never a hand-typed string, and
  `useUpcoming` builds its list with `upcomingFrom`.

## Migrations

The commands are in the README and in `package.json`.

`npm run db:*` needs `.env` with `SUPABASE_PROJECT_REF` and
`SUPABASE_DB_PASSWORD`. The password bypasses every policy, so the scripts only
talk to a server whose certificate verifies against Supabase's root
(`supabase/ca.crt`, a public certificate kept in the repo) — **never with
verification off**.

A migration is named `<utc stamp>_<what_it_does>.sql`
(`20260827040000_last_write_wins.sql`) — `npm run db:migration:new <name>`
stamps it to the second, and rounding the stamp by hand is fine as long as it
sorts after the last one. A policy is named for who it lets in and what they may
do: "Members have full access to <table>", or "Members can read <table>" for a
table the app never writes. **Applied migrations are never edited**: fix forward
with another one.
