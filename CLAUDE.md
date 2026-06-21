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

- **Everything is gated behind `is_member()`.** Every table has RLS enabled and a
  policy of the form `to authenticated using (is_member()) with check (is_member())`.
- **Never add an anon grant or a public view.** There is no public data. The anon
  role must always resolve to zero access.
- Membership is an allowlist: the `members` table holds the authorized Google
  account emails. A signed-in account that is not a member is fully fail-closed
  (sees nothing, can write nothing) and gets the "Sin acceso" screen.
- **Every new table must enable RLS and add an `is_member()` policy in the same
  migration.** A table without a policy is inaccessible, but never rely on that —
  be explicit.
- SECURITY DEFINER functions must always `set search_path = ''` and use fully
  qualified names (e.g. `public.members`).

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
- `npm run db:push` — push pending migrations to remote database
- `npm run db:migration:new <name>` — create a new migration file
