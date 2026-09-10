# Daico

Private household app — what the household has to do, buy, remember, keep and
pay — backed by Supabase. Access is restricted to a fixed allowlist of
authorized users. All data is sensitive and strictly access-gated. The README
says what the app is and how it is built; this file is the rules on top of it.

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
  (`auth.uid()`) has a row in `auth.identities` with `provider = 'google'`,
  marked verified, whose email is in `members` (case-insensitive). It binds to
  the user, not to how the session signed in: the auth server links a new
  verified identity to the existing user with the same email, so a session
  opened with another provider's credential for a member's address would pass
  too. **Google is the only provider enabled in the dashboard — keep it that
  way**; that toggle, which no migration or `db:verify` can see, is what makes
  «Google only» true.
- **Nobody becomes a user but a member.** The auth server asks
  `private.before_user_created()` before it makes a user — its «Before User
  Created» hook, switched on in the dashboard and pointed at that function —
  and the function refuses any email not in `members`, so a stranger who
  signs in leaves no row in `auth.users`. Adding a person is still their row
  in `members` first, then their sign-in; a pet is a row with a name and no
  email, inserted by hand. `db:verify` pins the function's body
  and that `supabase_auth_admin` alone may call it; the toggle is the other
  one it cannot see — **keep it on**.
- **Never add an anon grant or a public view.** There is no public data. The anon
  role must always resolve to zero access; `db:verify` fails on any privilege
  it holds.
- **`members` is the household**, not only the allowlist: a row per person,
  with the Google email they sign in with, and a row per pet, with none.
  `private.is_member()` binds to the rows that have an email, so a pet can
  neither sign in nor be let in. A signed-in account that is in no row is
  fully fail-closed (sees nothing, can write nothing) and gets the "Sin
  acceso" screen. The client still detects membership by reading `members`
  (members see rows, non-members see none), not via an RPC. The table is
  synced read-only (`MEMBERS_SPEC`, in `SHELL_SPECS`) so the household is
  known offline, and the app never writes it: every row is inserted by hand.
- **Every new table must, in the same migration: (1) enable RLS, (2) add a
  `private.is_member()` policy, AND (3) `grant` the needed privileges to
  `authenticated`** (e.g. `grant select, insert, update, delete on public.<table>
to authenticated`). RLS is a _filter on top of_ SQL privileges, not a
  replacement: a role with a policy but no GRANT gets "permission denied for
  table ..." before the policy is ever evaluated. **Never grant to `anon`.**
  A table that grants `delete` also gets the two triggers under «Offline-first»
  below, and `db:verify` refuses any other trigger on any table.
- **Every policy is `private.is_member()` and nothing else, with two
  exceptions.** A table whose rows are one member's (`checkups`,
  `health_records`) carries `member_id uuid`, a row of `members`, under the
  policy `private.is_member() and (member_id = private.member_id() or
private.is_pet(member_id))` on both `using` and `with check`: a select
  hands each member their own rows and the pets', and a write for the other
  person is refused. `private.member_id()` is the caller's own row, by the
  join `is_member()` makes; `private.is_pet()` is a row with no email.
  `db:verify` pins that shape to exactly the tables in its
  `MEMBER_ROW_TABLES` and the two functions' bodies, and a table there must
  never also carry the plain policy — permissive policies OR together. Which
  tables are per-member is a design decision (Salud's is written up below),
  never a default. The other exception is the email worker's role, under
  Viajes below, whose policies `db:verify` pins one by one.
- SECURITY DEFINER helpers used by RLS live in the **non-exposed `private` schema**
  (e.g. `private.is_member()`), never in `public` — a SECURITY DEFINER function in
  `public` is callable by anyone via the PostgREST `/rpc` API. They must always
  `set search_path = ''` and use fully qualified names (e.g. `public.members`).
- **The built page carries a Content-Security-Policy** (a `<meta>` injected by
  `vite.config.ts` at build; the static host can't set headers). Scripts run
  only from the page's own origin and may only talk to Supabase. Anything the
  app loads from a new origin (a font host, an embed) must be added there or the
  browser blocks it; `npm run preview` is where the policy is live locally.
- **`npm run db:verify` asserts these invariants against the live database**
  and fails on any drift. It runs automatically after `npm run db:push`. Run it
  after any schema change; if you add an invariant, add a check in
  `scripts/verify-db-security.mjs`.

## Offline-first model — read before touching data tables

The README's «Offline-first» says how the local store and the sync work. These
are the rules on top of it.

- **Every table an app's entries live in is offline-synced**, with a
  client-supplied `uuid` primary key and an `updated_at timestamptz`. The UUID
  gives an offline-created row a stable identity before it reaches the server
  (never `generated always as identity` for these). `updated_at` is the
  **last-write-wins key and is client-owned** — set at edit time and sent by
  the client. **Never add a trigger that bumps `updated_at` on update**: a
  server-side bump would use sync time and break LWW ordering for edits made
  offline. The one trigger every synced table **must** have is
  `private.last_write_wins()` (`before update`): it skips an update carrying an
  older `updated_at` than the stored row, so a stale offline edit can't
  overwrite a newer one on push and devices converge. A table the app may
  delete from also carries `private.record_deletion()` (`after delete`, into
  `deleted_rows`) and `private.delete_wins()` (`before insert`, which skips a
  row of an id deleted before): that is what makes a delete win over an edit
  of the row whenever the edit is pushed. An id is therefore never reused —
  what an undo puts back is a new row. `db:verify` checks every table with
  `updated_at` has the first trigger, every deletable table the other two,
  and no table any other.
- **A synced table is described in one place: `src/lib/offline/specs.ts`** — its
  row type (extending `SyncedRow`), the values any enumerated column may take,
  and its `TableSpec`, whose `columns` is keyed by column name so a column
  missing from either fails to compile; a column's DDL default lives there
  too. Adding one is the three steps in the README, with `SHELL_SPECS` in
  place of a module's `specs` when no single app owns the table, as with
  `attachments`. None of the steps is sync code: **never hand-write sync or
  SQL** — the generic `engine.ts` handles CRUD, the local-only bookkeeping and
  the LWW reconcile, and a thin hook over `useOfflineTable` gives the table
  its typed `insert` / `update` / `remove`. Conflict policy is last-write-wins
  with "delete wins".
- **A table that never leaves the device** (a blob cache, the engine's own
  bookkeeping) is a `LocalTableSpec` in `src/lib/offline/localTables.ts`,
  created and wiped with the rest, and brought to its DDL's shape when the
  store opens like a synced table is — so a column it gains must be one SQLite
  can add in place, nullable or with a default; its rows are read and written
  by whoever owns them, over the engine's `localQuery` / `localWrite`. They
  are never in `ALL_SPECS`.
- **What asks for a sync is installed once** (`installSyncTriggers`, from the
  shell's `AppProvider`, while a member is in): the connection coming back, and
  the app returning to the foreground. A table's hook asks to push after each
  of its own writes (`syncAfterWrite`, which pulls only when the last pull is
  stale) and for a run when its screen opens (`syncIfStale`) — never through
  listeners of its own. Nothing syncs before the member is in: there
  is nothing to sync for anyone else, and a run after a sign-out would build
  the local store again right after the sign-out wiped it.
- **The engine and sync are tested against real SQLite and a stand-in server**
  (`src/lib/offline/*.test.ts`, over `testing/sqlocalInMemory.ts` and
  `testing/fakeSupabase.ts`). A change to CRUD, the sync order or the conflict
  policy must come with a test there.
- **Guides are imported content the household shelves** (the README says how
  they get in): the app writes only a guide's `title`, `group_name` and
  `archived` — `guides` is granted `select, insert, update`, never delete —
  and never `guide_chapters`, whose grant is `select` only. The importer owns
  a guide's contents, not its shelf: for a guide it already knows it keeps
  those three columns as they are. A group is a column, never a table, for
  the reason Ideas' is. **Keep any large blob table out of `ALL_SPECS`** the
  way `guide_images` is — the sync engine pulls whole tables on every sync —
  and fetch it on demand into a local-only table. Source-site specifics belong
  in `scripts/import-guides/`, never in the app. **Never commit a guides
  dump** — it is private content, keep it outside the repo.
- **The local database is opened by the custom SQLocal worker in
  `src/lib/offline/sahpoolWorker.ts`, never SQLocal's default** — its header
  says why. Keep it as SQLocal's `processor` with the pins `vite.config.ts`
  explains, **never add anything that needs `SharedArrayBuffer` or
  cross-origin isolation**, and leave the one-connection lock in
  `src/lib/offline/singleTab.ts` in place.
- **A new build never replaces the one a page is running.** `registerType` is
  `'prompt'` — **never `'autoUpdate'`** — `injectRegister` is `null`, and
  `src/lib/appUpdate.ts` (its header says why) is the only place that decides
  when a version goes in and the only place that talks to
  `navigator.serviceWorker`; a change to when a version goes in must come with
  a test in `appUpdate.test.ts`. Whatever hides the page without the member
  leaving — the device's picker, its share sheet — and whatever a reload would
  cut short holds the version back through `holdUpdates`, never any other
  way. A pull asks for `*`, never the columns a spec names, so a build a
  migration got ahead of still brings its tables down.
- **The boot never waits for the server.** `App` draws from the session the
  client kept on the device (`storedSession` in `src/lib/supabase.ts`), never
  from `getSession()`, which refreshes an expiring token first and on a dead
  link waits minutes for it; the one exception is the page Google sends the
  member back to, where the session is still on its way. A session ends only
  on the client's `SIGNED_OUT` — the button, or the server refusing the
  refresh token — never on a request that got no answer. Every request the
  client makes and every call to the files worker goes through `fetchWithin`
  (`src/lib/fetchWithin.ts`), and a sync run ends at the first request that
  gets no answer (`gotNoAnswer`): the link is dead, not the table.
- **The membership check is offline-tolerant** (`AppContext` falls back to a
  per-user cached verdict when the live read fails). This is only a UI gate — the
  server's RLS is the real authority, so a stale `true` still reads nothing and has
  every queued write rejected on sync. Don't "harden" it by removing the cache, or
  members get locked out at the "Sin acceso" screen with no signal.

## Attachments and the household key — read before touching files or keys

The README's «Adjuntos» says how this works: the key hierarchy, the phrase
gate, what a sync does with the files. These are the rules on top of it.

- **`src/lib/householdKey.ts` is the only crypto code in the app** — never add
  another. Never send, log or persist the phrase, the master key or a file key
  anywhere else: a device keeps the master key as a non-extractable `CryptoKey`
  in IndexedDB (`masterKeyStore.ts`), and `useMasterKey` is the one place the
  app reads it.
- **Every sealed thing is bound to its row.** `encryptFile` takes what the
  blob is sealed for (`rowBinding(table, id)`, or `INBOX_KEY_BINDING`) as
  associated data, and `decryptFile` opens it under that name only, so a
  blob and its key moved to another row — by whoever can write rows, which
  the server can — open nowhere. A row is therefore given its id before it is
  sealed (`crypto.randomUUID()` ahead of the insert) and resealed under the
  same id. Files sealed before this (format byte 1) still open; a new seal is
  always format 2.
- **`household_key` is written once, directly to the server, online** (the
  first member's setup in `UnlockScreen`), never through the engine's queue: the
  unique index makes a racing second setup fail instead of leaving two keys.
  Never delete the row and never add a key-rotation path lightly — with the row
  gone or replaced, every attachment is unreadable.
- **Files travel outside the tables, through `src/lib/attachmentFiles.ts`
  only.** Attachments are pictures and PDFs (`ATTACHMENT_FILE_TYPES`) and
  their blobs are immutable: replacing one is a new attachment. The
  `attachments` row is an ordinary synced table shared by every app whose
  entries take attachments (`owner_kind`), so it lives in `SHELL_SPECS` and is
  drawn by the shared `src/components/Attachment*`, parametrized by the owner.
- **A PDF is drawn in the app, never handed to the system.** `src/lib/pdf.ts`
  is the only way into pdf.js, imported on demand, and a PDF leaves the app
  only through Compartir / Descargar. Agregar's two file inputs, pictures and
  PDF, stay two — `AttachmentPickDialog` says why.
- **A document is its files.** `documents` keeps a title and an expiry and
  nothing else: never add a column that holds what a document says (a number,
  a date of birth) — that is what the sealed files are for.
- **`inbox_key` is the one other key.** Written once like `household_key`, by
  the first device holding the master key that finds none (`InboxKeySetup`,
  straight to the server). The worker never holds anything that opens a file.
  `householdKey.ts` stays the only crypto code in the app; the worker's
  `seal.ts` is the one copy of the file format outside it, pinned by the round
  trip in `householdKey.test.ts`. `openInboxKey` refuses a published public
  half that is not the private half's other half, so a replaced public key
  is caught before a file sealed to it is trusted.
- **Which files every device keeps is `KEPT_OWNER_KINDS`** in
  `attachmentFiles.ts`: documents and trip rows — a row's own files and a
  flight's boarding passes, the two kinds in `TRIP_ROW_FILE_KINDS` — the
  latter until `TRIP_FILES_KEPT_DAYS` past the trip — the one exception to
  files being fetched on demand. Adding a kind there puts its every file on every device
  and is a decision to write up, never a default; files are still never pulled
  wholesale and never put in `ALL_SPECS`.
- **The bucket is R2, and the files worker (`worker/src/files.ts`) is the
  app's only way in.** The bucket has no address of its own — never enable
  its public development URL, never give it a domain — and the worker holds
  nothing but its binding: no secret, no database. The bucket has exactly two
  other credentials, both under «Backups» below: the read-only token the
  nightly job holds, and the read-write one a restore uses from `.env`. Every request carries the
  session's token, and the worker asks the database's API, with that token,
  for a count of `members`, so `private.is_member()` still decides. It takes
  only `application/octet-stream`, no larger than `ATTACHMENT_MAX_BYTES` plus
  the seal's overhead, under an id that is a UUID, and answers only the app's
  origin. This gate lives outside the database, where `db:verify` cannot see
  it: `worker/src/files.test.ts` is what pins it, and a change to what the
  worker lets through comes with a test there. It is deployed on its own with
  the `files:*` scripts, never by the app's deploy, and its address is a
  custom domain given in the dashboard — never a route in its config, so
  that no token has to edit the zone's DNS. Nothing is kept in
  Supabase Storage: `db:verify` refuses any bucket there, and any policy on
  `storage.objects`.
- **Tests**: `householdKey.test.ts` (Node's WebCrypto),
  `attachmentFiles.test.ts` (real SQLite + the fake server's stand-in for the
  files worker) and `worker/src/files.test.ts` (the worker over a bucket in
  memory). A change to the file format, the queue states, the sweep or the
  worker's gate must come with one.

## Backups — read before touching them

The README's «Backups» says what the nightly copy holds, where it lands and
how it comes back. These are the rules on top of it.

- **The job reads through `backup_reader` and its three functions, and holds
  nothing else.** The role has no privilege on any table:
  `private.backup_rows` hands back a public table, `auth.users`,
  `auth.identities` or the migrations list; `private.backup_digest` a hash
  over a table's rows; `private.record_backup` writes the run's row
  in `backup_runs` and prunes that table to ninety days. `db:verify` pins the
  three bodies, that the reader alone may call them, that it can log in and
  nothing more, and that it holds no table privilege. Never grant the role a
  table, never give the job the service key or the database password, and
  never add a function it may call without pinning it there.
- **`backup_runs` is the one table the app never writes**: `select` to
  `authenticated`, in `SHELL_SPECS` since no app owns it, the last-write-wins
  trigger and no delete pair. It carries counts, never content — a stage, row
  and object counts, bytes. Ajustes and `BackupMark` read it through
  `src/shell/backups.ts`, whose `backupTrouble` is the one place that decides
  when the mark shows and the line turns red; a change to it comes with a
  test in `backups.test.ts`.
- **A night's files are sealed to the age recipient and opened only by the
  identity**, which lives in a note in Notas and in nothing that runs: never
  in `.env`, never in a secret, never printed by anything but `backup:key`,
  once. Objects are copied as they are, ciphertext under the household key.
- **The job prints counts and nothing else.** Its log is public. No row, no
  email, no key, no object id; a failure is its stage and its message.
- **The job never deletes.** Pruning is the bucket's lifecycle rule on
  `daily/`; `objects/`, `guides/` and `monthly/` are kept. The B2 key it
  holds lists and writes and cannot delete, and the R2 token it holds reads.
- **The scripts share `scripts/lib/s3.mjs` and `scripts/lib/snapshot.mjs`**,
  a signed fetch and the file format, both tested. A change to the format
  bumps `SNAPSHOT_VERSION` and comes with a test; a reader refuses a later
  version. Never take the AWS SDK for what the fetch does: the job runs with
  secrets in hand, and every dependency there is a party to trust.
- **A restore goes into an empty project**, refuses one with rows or with
  other migrations applied, and loads in one transaction. A change to it is
  tried against a scratch project before it is trusted.

## Statements (Gastos) — read before touching them

The README's «Gastos» says what a statement is and what its row keeps in the
clear. These are the rules on top of it.

- **A statement's contents never reach the server in the clear.** Every purchase
  and installment lives in `payload` under its own `wrapped_key`, sealed by
  `src/apps/gastos/payload.ts` (gzip, then `encryptFile` from `householdKey.ts`
  — never other crypto); a merchant rule's `pattern` is sealed the same way.
  **Never add a column that names a merchant or an amount of a line**, and never
  log or persist opened contents outside the in-memory cache of what has been
  opened under the key (`src/lib/opened.ts`, emptied when the key goes). **Gastos
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
- **One parser per bank layout** in `src/apps/gastos/parsers/`, over the
  positioned words `pdfWords.ts` gets through `src/lib/pdf.ts`. A parser throws
  `UnknownLayout` when the pages are not its own and a `StatementError` (a
  message in the user's words) when they are but do not reconcile with the
  printed totals; an import that fails saves nothing.
- **Never commit a real statement**, nor a fixture derived from one: the parser
  tests build synthetic pages with the builders in `parsers/testing/` and
  invented holders. The privacy rule below applies to test data too.
- **Categories are the fixed `SPENDING_CATEGORIES`**; a new one is a new member
  plus its label in `labels.ts`. Filing is done on display by `rules.ts`, so a
  rule change refiles every statement at once. **Never add a built-in merchant
  list**: the repo is public and where the household shops is private.

## Notes (Notas) — read before touching them

The README's «Notas» says what a note is. These are the rules on top of it.

- **A note's body never reaches the server in the clear.** It is sealed by
  `src/apps/notas/body.ts` (gzip, then `encryptFile` from `householdKey.ts` —
  never other crypto) under its own `wrapped_key`, exactly like a statement's
  payload. **Never add a column that holds what a note says**, and never log or
  persist an opened body. `NOTE_BODY_SCHEMA` is bumped when the sealed shape
  changes, and a build that meets a later schema refuses the note rather than
  reading it as an older one, for the reason a statement's does.
- **Notas contributes only titles to search** (`fields: ['title']`, plus its
  attachments by name), for the reason Gastos contributes nothing.
- **The body is pulled with the table**, so a note is text and nothing else: a
  picture goes in as an attachment (`'note'`, fetched on demand like a chore's),
  never inside the body.
- **Never add a pinned column**: the list is grouped by `updated_at`
  (`grouping.ts`), and the note last written on is the one being looked for.
- **What is written about a chore or a date is `comments`** («Comentarios»,
  written through the shared editor), and the mark drawn on any listed entry is
  `'comments'` — Notas is the app called notes. In Notas that mark can only
  mean the entry has attachments.

## Ideas — read before touching them

The README's «Ideas» says what an idea is. These are the rules on top of it.

- **A group is a column (`ideas.group_name`), never a table.** It exists
  exactly while an idea names it, which is what keeps a group from ever being
  left empty — by the schema, not by a trigger or the UI. Never add an
  `idea_groups` table: a foreign key between rows that cascade has a race the
  offline model can't survive — one device deletes a group's last idea and the
  server drops the group, another adds to that group offline, and its row is
  then refused for good on sync. With the column, that idea just brings the
  group back. A group is never renamed; its ideas are moved one at a time.
- **Everything travels in the clear**, the body included, like a recipe's: an
  idea is where the household keeps what to try and where to go, not where a
  secret is written down — that is Notas, sealed. So **Buscar matches an
  idea's title, group and body**, and an idea carries pictures the way a chore
  does.
- **Groups are dividers, nothing more**: no group page, no count, no collapse.
  Their order is the household's language (`Intl.Collator('es')` in
  `grouping.ts`), with the ideas filed under none — `group_name` empty,
  `NO_GROUP` — ahead of them all and under no divider.

## Viajes — read before touching them

The README's «Viajes» and «Correo a Viajes» say what a trip and its rows are
and what becomes of a forwarded email. These are the rules on top of it.

- **Viajes is never an agenda.** Nothing is grouped by day and only a pendiente
  is ever ticked. The kinds (`TRIP_KINDS`) are fixed sections in that order,
  every kind uses the same columns, leaving the ones it has no use for null,
  and a row's kind is never changed. **Only a dated pendiente reaches Próximo.**
- **Everything travels in the clear**: a row's free text is `comments`, like a
  chore's, so Buscar matches a booking code, and a row carries pictures the way
  a chore does. Airport codes are typed by hand and offered from the curated
  list in `airports.ts` — never a lookup, which does not work offline, and never
  the full IATA set, which would be precached on every device.
- **A flight's boarding pass is an attachment of the pasaje under a kind of
  its own**, `'boarding_pass'`, on a shelf of its own on the page — drawn
  only for a flight (`isFlight`: a ticket with both airport codes), since a
  bus boards with its ticket: the pasaje's other files — the e-ticket a
  forwarded confirmation brings — never stand in for it. A trip row's files are the two kinds in
  `TRIP_ROW_FILE_KINDS`: a delete takes both, Buscar finds both, the row's
  mark counts both, and both are kept on every device by the trip-files
  rule. The word is «boarding pass», lowercase in a row and invariable in
  number (`BOARDING_PASS_LABEL`).
- **The boarding pass Próximo asks for is deduced, never stored.**
  `useTripsUpcoming` lists «boarding pass · {pasaje}» for a flight — a ticket
  with both airport codes (`isFlight`); a bus leg has none and no check-in —
  that is dated, has not left, is within `BOARDING_PASS_NOTICE_DAYS` (the day
  before) and has no attachment of that kind. Nothing is ticked and no column
  says so: the first file on the shelf ends it, and it is never overdue.
  Never add a `checked_in` column or a pendiente for it.
- **A forwarded boarding pass is staged, never mixed with bookings.** The
  worker stages it as a `trip_inbox` row of kind `'boarding_pass'`, its
  flight in the columns and its files beside it — pictures as well as PDFs,
  each with its `mime`; an email that is bookings and a boarding pass at once
  is refused with a reply, and one whose pass came as a link rather than a
  file is answered with what to do instead. The app reviews each as a group
  of its own (`InboxGroup.key` is the row, not the email) and asks for the
  pasaje, not the trip: `suggestedBoardingPassChoice` preselects the flight
  of a trip ahead that matches by day and airports, the pasaje — or the trip
  too — can be made on the spot, and `confirmBoardingPass` seals each file
  for that pasaje's shelf and lands on the pasaje with the undo. The worker
  still never reads `trips` or `trip_items`.
- **`trip_inbox` is staged by the email worker in `worker/`, never made up by the
  app**, which only confirms a group of staged rows into real ones (through the
  offline engine, undoable for a moment, which stages the rows again as new
  rows — an id is never reused) or deletes them. Staged rows reach neither Buscar nor Próximo: they are suggestions, not
  commitments.
- **The email worker never holds the service key.** It connects as
  `trip_inbox_writer`, a role with exactly the grants and policies `db:verify`
  pins — its header says what it holds and why — lets through only mail from
  a member that passed DMARC in the receiving server's own verdict (the first
  `Authentication-Results` header, and only when it is headed by that
  server's name, checked before the database is even opened), logs nothing of
  an email, and always replies to the sender — a reply marked
  `Auto-Submitted`, and never to a mail that is itself a machine's. An email
  is staged once: its Message-ID goes into `trip_inbox_imports` with its
  rows, and a second delivery is answered without being read again. What
  reaches the model is bounded (PDF count and bytes, text length, one retry),
  and what comes back is cut to length and checked for real dates before it
  is written. It is deployed on its own with the `worker:*` scripts, never by
  the app's deploy.
- **A staged file is opened only at confirm** (`openedFilesOf`), to be sealed
  again for the attachment it becomes: a file is bound to its own row, so it
  cannot move from a staged row to an attachment as it is. `trip_inbox_files`
  is never in `ALL_SPECS`: the module's `afterSync` (`syncInboxFiles`) fetches
  every listed file into the local `INBOX_FILES`, one file per request, the
  one other table fetched whole, few and short-lived. A confirm clears each
  staged row as soon as its own row is written, and stops at a write that
  fails, so what is left staged is what is still to confirm. The staged files
  are deleted only once the confirm can no longer be undone
  (`settleInboxUndo`), at discard, or by the sweep a month on.

## Salud — read before touching them

The README's «Salud» says what a checkup and a health record are. These are
the rules on top of it.

- **Every row is one member's — a person's or a pet's — and the server keeps
  it that way.** `checkups` and `health_records` carry `member_id`, a row of
  `members`, under the per-member policy above, so a device only ever holds
  the signed-in member's rows and the pets'. Never add a way to see or write
  the other person's, and never a name in code: the names are
  `members.display_name`, and the household is edited by hand. The server
  fills `member_id` with the caller's own row when a build sends none, so
  a build from before the column still writes.
- **Salud shows one member at a time.** The row of chips over the list
  (`MemberChips`) is you first, then the pets — `viewableMembers` in
  `household.ts`, by the session's email — and the whole list is that
  member's. The choice is remembered on the device (`src/lib/viewedMember.ts`,
  forgotten on sign-out). The bar adds to the member being viewed, and the
  member is chosen at birth and never changed, like the kind. A pet's row
  says whose it is away from the list — a `StaticChip` on the page, «título
  · nombre» in Próximo, «nombre · …» in Buscar — and a member's own says
  nothing. No + for members anywhere in the app, and the chips are never a
  filter of «all».
- **A curtain, not a vault.** A checkup's and a study's files are ordinary
  `attachments` rows and bucket objects, shared under the household's one
  key: the other member's screens never show them, but their device syncs
  the rows. Never present it as more than that.
- **A checkup always comes back from the day it was marked.** No `repeat_from`:
  the arithmetic is `addRepeats` from the day marked and never from the day it
  was due — a check is worth nothing twice in a row. One that does not repeat
  is done once marked; one that repeats stays overdue until marked, like a
  chore and unlike a date.
- **A checkup's files are what the check needs; a study's are what it
  found.** A checkup has comments and attachments like a chore — the orden,
  the turno's confirmation — and one that repeats keeps its files from one
  time to the next, since they are about the check and not one occurrence.
  A study has attachments and no comments: it is its files, by Documentos'
  rule, so never add a column that holds what a study found. Both kinds'
  files are fetched on demand, never kept on every device.
- **Nothing links a checkup to a study**, not a key and not a shortcut: the
  title and the date already say which check a study came from, and a key
  between rows has the offline race Ideas' groups avoid.
- **The kind is chosen at birth and never changed**; the entry page states it
  with a `StaticChip`. Both kinds share the one route
  `/salud/:id/:attachmentId?`, the id looked up in both tables, because
  `entryPath` is all Próximo and Buscar know how to write.

## Privacy — the code is public, the data is private

- This repository is public; the database is private. **Never reference any real
  person in committed files** — no names, relationships (wife, husband, partner,
  couple, family), addresses, phone numbers, or personal emails — anywhere in code,
  comments, UI strings, README, migrations, or config.
- Keep everything generic: `member`, `user`, `household`. All personal data lives
  only in the database (e.g. the `members` table). **Migrations must never seed real
  emails or names** — add real members manually via the Supabase SQL editor.
  The one name in the repository is the LICENSE's: a licence needs a holder,
  and that is the one place a name appears.
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
  anything may name. ESLint enforces this.
- **Types**: `src/types.ts` holds only what more than one part of the app agrees
  on (`SyncedRow`, `EntryMark`, `AttachmentOwner`). A synced row's type lives
  with its spec; everything else lives with whoever owns it.
- **No magic numbers**: a domain constant is named, never hardcoded, and lives with
  whoever owns it — an app's tuning in `src/apps/<id>/`, the shell's in
  `src/shell/`, a table's column default with its spec, an outside address in
  `src/config.ts`. Never a shared bag of constants.
- **Dates and times**: always dd/mm order, never mm/dd, and always the 24-hour
  clock — `formatDate` / `formatDateShort` / `formatTime` from
  `src/utils/dateUtils.ts`, picked with `DatePicker` and `TimePicker` (or the
  `Native*` ones behind a control of your own). ESLint bans the native inputs,
  which print in the browser's language.
- **Repetition**: anything that comes back says so the same way — `repeat_every`
  and `repeat_unit` (`day`/`week`/`month`/`year`), both null or both set, on
  `chores`, `dates` and `checkups` alike, with the arithmetic and the words for
  it in `src/utils/recurrence.ts`, under the apps because one may not import
  from another. What a chore counts its next date from (`repeat_from`) and the
  day it was last marked (`last_done_on`) are its own: a date is never done,
  and a chore that repeats never is either — it is up to date, which is why
  `chores` has no `done` column.
- **Icon-only controls**: must have an accessible label (`aria-label` + `title`).
- **Screens are built from the shared pieces in `src/components/`**, never
  hand-assembled: `ListPage` and `EntryPage` are the two shapes every screen
  takes, and everything that goes on them — the rows a list is made of, the
  fields a form is made of, the dialog, the bar a growing list ends in — has a
  component there already. Read the directory before writing a control; never
  hand-write control or button classes in a page, and a control with no
  component of its own takes its classes from `src/components/controlClasses.ts`.
  This is what keeps every app looking like one app.
- **Rows, not cards**: a list is plain rows separated by hairlines — on each row
  `border-b border-border`, or on the list `divide-y divide-border` — never a
  bordered box. A group of rows is headed by `SectionLabel`; a done/undone mark
  is `CheckSquare`. Corners are square everywhere — no `rounded-*`.
- **Marks on a listed entry** (has comments, repeats, ...) are declared once per
  app in `src/apps/<id>/marks.ts` as `EntryMark[]` and drawn by `EntryMarks` —
  the app's own list passes them as `ChecklistItem`'s `trailing`, and its
  `useUpcoming` sets them on each `Upcoming`, so Próximo shows the same marks.
  Never draw an ad-hoc icon on a row: a mark that is not in `marks.ts` is
  missing from Próximo. A new kind of mark is a new `EntryMark` member plus its
  icon.
- **Nothing is destroyed on a single tap**: a delete goes through
  `DeleteDialog`, from the trash in the entry's head. **The undo is the
  app's, not a screen's**: whatever can be undone — a mark, a clear, a group
  of rows just confirmed — is offered through `offerUndo` (`src/lib/undo.ts`)
  and drawn by `UndoNotice`, above the screen's `BottomBar` when it has one
  and pinned at the bottom by the shell when it has none, its seconds counted
  from when it is first seen; never for a delete, and never a bar of a
  page's own.
- **No creation form and no save button.** The add bar's + writes the row
  with the typed title and the defaults and opens it with a plain `navigate`;
  every control on the page saves on change and every text through
  `useTextSave`. Where one column can never be changed once the row exists,
  the + asks it first through `KindPickDialog`, its `onAdd` returning false so
  the bar keeps the title for a dismissed question; nothing else is ever asked
  at birth — a column with no sensible default is a design question, never a
  form. **The one control that leaves a page is the square that marks it**, a
  `CheckRow` under the head with the list's words: it writes what the list's
  square writes, offers the same undo, and leaves back to where the page was
  opened from (`useLeaveBack`), so the page never shows the after-state.
- **Every free text is `Body`** (`src/components/editor/`), never a
  `TextArea`, never a second markdown renderer; the one box that is not a
  text but a paste — Gastos' rules import — is a `TextArea` on purpose. A text that is the entry
  itself takes the field's name as its placeholder («Contenido»); what is
  written _about_ an entry is drawn by `Comments`, headed like the sections
  around it, and a page that takes comments never draws a `Body` of its own.
  **The editor draws exactly what `Markdown` draws**: `Body` shows the
  reader until the editor's chunk arrives, so any block the two draw
  differently jumps on screen. They share
  `src/components/markdown/classes.ts`, the editor has no height of its own,
  a soft line break reads as the space it is on both sides, every other space
  is kept on both, and what the editor does not model — a GFM table, a
  directive, an image by address — is kept as the text it is. The round trip
  is tested headlessly in `BodyEditor.test.ts`, and that the two draw the same
  elements in `parity.test.tsx`: a change to how either draws a block must
  keep that test green.
- **A page is left, never stacked on**: `useLeave` for every delete and the
  header's arrow, `useLeaveBack` for the mark that leaves; a plain link or
  `navigate` only going down, from a list to an entry. `src/lib/visited.ts`
  is the record both read, and a change to it comes with a test in
  `visited.test.ts`.
- **The title is the heading** (`EntryHead`): normalised on blur, never saved
  empty, with the trash at its right and the app's chips under it.
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
- `useUpcoming`, `search` and `afterSync` on a module are optional adapters; a
  module without the first two simply doesn't contribute to Próximo or search
  (say why in the module when it is deliberate), and `afterSync` is for what
  an app keeps beside its tables and must fetch after them — the shell runs it
  at the end of every sync run, with the attachment files' work.
  `search(query)` is a plain async function (not a hook)
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
table the app never writes, and it fits in Postgres's 63 characters, or it is
stored cut short. **Applied migrations are never edited**: fix forward with
another one.

**A deploy assumes quiet devices.** A schema change ships as `db:push`, then
the push to `main` that deploys the build — in that order, since the new
build sends what the new schema takes — with `worker:deploy` before either
when a worker is touched. Through all of it, take two things as given: no
device holds a queued offline edit, and nobody touches the app between
`db:push` and both phones running the new build. That is the household's
undertaking, and it is what keeps a migration simple: a column the build
stops sending is dropped in the same migration, nothing is kept nullable for
one deploy, and a backfill never bumps `updated_at` — a pull takes a server
row of the same instant whose columns read differently, so the value comes
down on its own. The price is paid only in that window: a build that still
sends a dropped column, or lacks one the schema now requires, has its writes
refused for good (a column error is a permanent refusal to the engine), and a
queued edit from before the update is refused the same way. **So when a
migration has that shape — it drops or renames a column a running build
sends, adds a required column that build does not send, or narrows what a
policy accepts from it — say so plainly in the handover:** name the window,
tell the owner to run the steps back to back and to write nothing in the app
until both phones have the update, and say what a write in the window would
cost. A migration that only adds a table, or a nullable or defaulted column,
has no window and needs no warning.
