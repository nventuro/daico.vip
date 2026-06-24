# Daico

Private household app for tracking chores, appointments, and personal documents,
backed by Supabase. Access is restricted to a fixed allowlist of authorized users.
All data is sensitive and strictly access-gated.

## Tech Stack

- React + TypeScript + Vite
- Tailwind CSS v4 (via `@tailwindcss/vite` plugin)
- Supabase (Postgres + Google OAuth) — migrations in `supabase/migrations/`
- GitHub Pages (auto-deploy via `.github/workflows/deploy.yml`), domain `daico.vip`

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
  to authenticated`). RLS is a *filter on top of* SQL privileges, not a
  replacement: a role with a policy but no GRANT gets "permission denied for
  table ..." before the policy is ever evaluated. **Never grant to `anon`** —
  anon must stay fully locked out.
- SECURITY DEFINER helpers used by RLS live in the **non-exposed `private` schema**
  (e.g. `private.is_member()`), never in `public` — a SECURITY DEFINER function in
  `public` is callable by anyone via the PostgREST `/rpc` API (the security advisor
  flags this). They must always `set search_path = ''` and use fully qualified
  names (e.g. `public.members`).
- **`npm run db:verify` asserts these invariants against the live database**
  (RLS on every public table, an `is_member()` policy on each, zero anon
  privileges, no SECURITY DEFINER function or view in `public`, etc.) and fails on
  any drift. It runs automatically after `npm run db:push`. Run it after any schema
  change; if you add an invariant, add a check in `scripts/verify-db-security.mjs`.

## Offline-first model — read before touching data tables

- **Chores and the shopping list are offline-first.** A generic engine in
  `src/lib/offline/` runs SQLite in the browser (SQLocal over OPFS, in a Web
  Worker) as the source of truth the UI reads/writes, and a sync engine
  reconciles with Postgres on load / reconnect / app-focus. The README has the
  architecture overview; this section is the rules.
- **Every offline-synced table must have a client-supplied `uuid` primary key and
  an `updated_at timestamptz`.** The UUID gives an offline-created row a stable
  identity before it reaches the server (never `generated always as identity` for
  these). `updated_at` is the **last-write-wins key and is client-owned** — set at
  edit time and sent by the client. **Never add a trigger that bumps `updated_at`
  on update**: a server-side bump would use sync time and break LWW ordering for
  edits made offline. The standard table/RLS/grant rules above still apply in the
  same migration.
- **To add an offline table:** write the migration (uuid PK + `updated_at` + the
  usual RLS/policy/grants), add a `TableSpec` to `src/lib/offline/specs.ts` and to
  `ALL_SPECS`, then add a thin typed hook over `useOfflineTable` (see
  `useShoppingList` / `useChores`). Do **not** hand-write sync or SQL — the generic
  `engine.ts` handles CRUD, the local-only `pending_op`/`synced` bookkeeping, and
  the LWW reconcile. Conflict policy is last-write-wins with "delete wins".
- **Do not change the SQLite persistence to the default OPFS VFS or anything
  needing `SharedArrayBuffer`.** That requires `COOP`/`COEP` response headers,
  which **GitHub Pages cannot set**. SQLocal's OPFS SAH Pool VFS (the default it
  uses) needs no special headers — keep it that way. Likewise keep
  `worker: { format: 'es' }` and `optimizeDeps.exclude: ['sqlocal']` in
  `vite.config.ts`, or the worker/wasm won't bundle.
- **The membership check is offline-tolerant** (`AppContext` falls back to a
  per-user cached verdict when the live read fails). This is only a UI gate — the
  server's RLS is the real authority, so a stale `true` still reads nothing and has
  every queued write rejected on sync. Don't "harden" it by removing the cache, or
  members get locked out at the "Sin acceso" screen with no signal.

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
- **Components**: functional components with hooks, one component per file in `src/components/`.
- **Types**: shared types in `src/types.ts`.
- **No magic numbers**: domain constants must be named in `src/types.ts`, never hardcoded.
- **Date format**: always dd/mm order, never mm/dd. Use `formatDate` (long locale) or
  `formatDateShort` (dd/mm/yyyy) from `src/utils/dateUtils.ts`.
- **Icon-only controls**: must have an accessible label (`aria-label` + `title`).
- **No duplicated logic**: extract shared computation; check for existing helpers first.
- **Zero lint errors**: run `npm run lint` after changes and fix everything before done.
- **Zero build warnings**: run `npm run build` after changes and fix everything before done.

## Git

- **Commits are authored by the repository owner, never by Claude / an AI assistant.**
  Do not add `Co-Authored-By` trailers, "Generated with Claude Code" lines, or any
  other AI attribution to commit messages or PR descriptions.

## Commands

- `npm run dev` — start dev server
- `npm run build` — production build
- `npm run preview` — preview production build
- `npm run lint` — run ESLint

### Database

Requires `.env` with `SUPABASE_PROJECT_REF` and `SUPABASE_DB_PASSWORD`.

- `npm run db:link` — link local project to remote Supabase (run once)
- `npm run db:push` — push pending migrations to remote database, then verify invariants
- `npm run db:verify` — check the live DB against the security invariants (read-only)
- `npm run db:migration:new <name>` — create a new migration file
