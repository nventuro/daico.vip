-- =============================================================================
-- Migration: Despensa — the rare things bought once, kept by when they expire.
--
-- Not the day-to-day stock (milk, flour, salt), which is bought again before
-- anyone thinks of it, but the jar bought for one recipe that sits at the back
-- of a shelf until it goes off: a title, when it expires, where it is kept,
-- comments and pictures. What expires within two weeks, or already did, is on
-- top of the list and in Próximo.
--
-- The expiry is the package's, and a package often prints only the month
-- ("VTO 03/2027"): `expires_on` then holds that month's last day, the day it
-- is good through, and `expires_month_only` says to show only the month. The
-- flag means nothing without a date, so it is never set without one.
--
-- An item used up is marked, not deleted (`used_on`), and kept under
-- «Usados» at the foot of the list; the trash is for one entered by mistake.
--
-- Same security model as every other table: RLS on, a single
-- private.is_member() policy, CRUD granted to `authenticated` only (never
-- `anon`). Offline-first specifics (client-supplied uuid, client-owned
-- `updated_at`) as in the dates migration, with the last-write-wins trigger,
-- and the delete-wins pair since the app deletes from it.
-- =============================================================================

create table pantry_items (
  id uuid primary key default gen_random_uuid(),
  title text not null check (length(title) > 0),
  -- The day it is good through; null for a package that gives none.
  expires_on date,
  -- Whether the package gave only the month, `expires_on` being its last day.
  expires_month_only boolean not null default false,
  check (expires_on is not null or not expires_month_only),
  -- Where in the house it is kept.
  place text not null check (place in ('cupboard', 'fridge', 'freezer')),
  comments text,
  -- The day it was used up; null while it is still in the house.
  used_on date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table pantry_items enable row level security;

create policy "Members have full access to pantry_items" on pantry_items
  for all to authenticated using (private.is_member()) with check (private.is_member());

revoke all on public.pantry_items from anon, authenticated;
grant select, insert, update, delete on public.pantry_items to authenticated;

create trigger last_write_wins before update on public.pantry_items
  for each row execute function private.last_write_wins();
create trigger delete_wins before insert on public.pantry_items
  for each row execute function private.delete_wins();
create trigger record_deletion after delete on public.pantry_items
  for each row execute function private.record_deletion();

-- An item's pictures are attachments owned by it, fetched on demand like a
-- chore's.
alter table attachments drop constraint attachments_owner_kind_check;
alter table attachments add constraint attachments_owner_kind_check
  check (owner_kind in ('chore', 'document', 'note', 'trip_item', 'idea', 'checkup', 'health_record', 'boarding_pass', 'pantry_item'));
