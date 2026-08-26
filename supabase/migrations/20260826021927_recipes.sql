-- =============================================================================
-- Migration: recipes (offline-first).
--
-- A recipe is a titled document written in the app's markdown dialect
-- (CommonMark + GFM tables + the reader's directives, e.g. an `:::ingredients`
-- block that renders as a tickable list). A recipe is created with only its
-- title and written afterwards, so an empty body is a valid row. `minutes` and
-- `servings` are optional, purely descriptive numbers.
--
-- Same security model as every other table: RLS on, a single private.is_member()
-- policy gating all access, and CRUD granted to `authenticated` only (never
-- `anon`). RLS is a filter on top of privileges, so the grant is required in
-- addition to the policy.
--
-- Offline-first specifics:
--  - `id` is a UUID the *client* supplies on insert, so a recipe created with no
--    connection has a stable identity before it ever reaches the server (a
--    server-generated identity PK could not be created offline). The default
--    only covers rows inserted manually via the SQL editor.
--  - `updated_at` is the conflict-resolution key for last-write-wins, and it is
--    deliberately CLIENT-OWNED: the client sets it to the moment of the edit and
--    sends it. There is intentionally NO trigger bumping it to now() on update —
--    an edit made offline at 10:00 must keep losing to another device's 10:05
--    edit even if it only syncs at 11:00. A server-side bump would use sync time
--    and break that ordering.
-- =============================================================================

create table recipes (
  id uuid primary key default gen_random_uuid(),
  title text not null check (length(title) > 0),
  body text not null default '',
  minutes integer check (minutes is null or minutes > 0),
  servings integer check (servings is null or servings > 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table recipes enable row level security;

create policy "Members have full access to recipes" on recipes
  for all to authenticated using (private.is_member()) with check (private.is_member());

-- Strip any surplus Supabase's project-level default privileges may have
-- auto-granted on table creation (TRUNCATE/REFERENCES/TRIGGER/MAINTAIN), then
-- grant exactly the set members need. RLS still gates every row by
-- is_member(). Never anon. (Mirrors the per-table pattern in harden_security.)
revoke all on public.recipes from anon, authenticated;
grant select, insert, update, delete on public.recipes to authenticated;
