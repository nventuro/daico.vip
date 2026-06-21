-- =============================================================================
-- Migration: initial schema — members allowlist + chores
--
-- Security model: EVERYTHING is gated behind `is_member()`. There are no anon
-- grants and no public views. A signed-in Google account that is not in the
-- `members` table passes the `authenticated` role but fails `is_member()`, so
-- every row is invisible and every write is rejected (fail-closed).
-- =============================================================================

-- ─── Members allowlist ───────────────────────────────────────────────────────

create table members (
  email text primary key,
  display_name text not null check (length(display_name) > 0)
);

alter table members enable row level security;

-- SECURITY DEFINER so it can read `members` regardless of the caller's RLS,
-- which also avoids any policy recursion. `search_path = ''` forces fully
-- qualified names (public.members) and blocks search_path hijacking.
create function is_member()
returns boolean language sql security definer stable
set search_path = '' as $$
  select exists (
    select 1 from public.members
    where email = auth.jwt() ->> 'email'
  )
$$;

grant execute on function is_member() to authenticated;

-- Members may read the household roster; the list itself is only edited via SQL.
create policy "Members can read members" on members
  for select to authenticated using (is_member());

-- ─── Chores ──────────────────────────────────────────────────────────────────

create table chores (
  id bigint generated always as identity primary key,
  title text not null check (length(title) > 0),
  notes text,
  done boolean not null default false,
  due_on date,
  created_at timestamptz not null default now()
);

alter table chores enable row level security;

create policy "Members have full access to chores" on chores
  for all to authenticated using (is_member()) with check (is_member());

-- ─── Members ─────────────────────────────────────────────────────────────────
-- Do NOT seed real emails or names here: this migration is committed to a public
-- repository. Add the authorized members manually in the Supabase SQL editor, e.g.
--
--   insert into members (email, display_name)
--   values ('user@example.com', 'Miembro');
--
-- Until at least one member exists, the app correctly denies access to everyone.
