-- =============================================================================
-- Migration: dates (offline-first).
--
-- A date is a titled calendar entry — a birthday, an appointment, a renewal —
-- that may repeat, with a notice window that decides how far ahead it shows on
-- the home screen. A date is not a task: nothing is ever "done", and the app
-- never rewrites a row on its own. `occurs_on` is the ANCHOR the user entered;
-- for a recurring entry the next occurrence is computed on read from that
-- anchor (every `repeat_months` months, or yearly), so a birthday rolls over by
-- itself with zero writes. A one-off entry whose date has passed simply stays
-- until it is deleted.
--
-- The column is `occurs_on` rather than `on`: `on` is a reserved word in both
-- Postgres and SQLite, and the client's local store interpolates column names
-- into SQL unquoted.
--
-- Same security model as every other table: RLS on, a single private.is_member()
-- policy gating all access, and CRUD granted to `authenticated` only (never
-- `anon`). RLS is a filter on top of privileges, so the grant is required in
-- addition to the policy.
--
-- Offline-first specifics:
--  - `id` is a UUID the *client* supplies on insert, so an entry created with no
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

create table dates (
  id uuid primary key default gen_random_uuid(),
  title text not null check (length(title) > 0),
  occurs_on date not null,
  repeat text not null default 'none' check (repeat in ('none', 'yearly', 'months')),
  repeat_months integer check (repeat_months is null or repeat_months > 0),
  notice_days integer not null default 7 check (notice_days >= 0),
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table dates enable row level security;

create policy "Members have full access to dates" on dates
  for all to authenticated using (private.is_member()) with check (private.is_member());

-- Strip any surplus Supabase's project-level default privileges may have
-- auto-granted on table creation (TRUNCATE/REFERENCES/TRIGGER/MAINTAIN), then
-- grant exactly the set members need. RLS still gates every row by
-- is_member(). Never anon. (Mirrors the per-table pattern in harden_security.)
revoke all on public.dates from anon, authenticated;
grant select, insert, update, delete on public.dates to authenticated;
