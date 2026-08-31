-- =============================================================================
-- Migration: trips (offline-first) and the rows a trip is made of.
--
-- A trip is what is booked and what is still missing in the weeks before
-- leaving, and where the booking code and the address are looked up during it.
-- It is never an agenda: nothing is grouped by day and only the things to
-- resolve beforehand are ticked.
--
-- `trips` holds the title and the days, both nullable — a trip exists before
-- its dates do, and the dates are stored rather than derived from the rows,
-- since a to-do dated a week early would otherwise move the trip's start.
--
-- `trip_items` is every row of a trip in one table: a pendiente to resolve and
-- the four things that get booked, told apart by `kind`. Every class uses the
-- same columns and leaves the ones it has no use for null. `on` and `at` are
-- reserved words in both Postgres and SQLite (and the client's local store
-- interpolates column names unquoted), hence `on_date` / `at_time`.
--
-- The cascade is the only one in the schema: a trip's rows have no meaning
-- without the trip. It is safe here because the client pushes `trips` before
-- `trip_items` (their order in ALL_SPECS), so a row never reaches the server
-- ahead of the trip it names.
--
-- Everything travels in the clear, gated by private.is_member() like every
-- other table: a row's free text is `comments`, exactly as on chores and dates.
--
-- Same security model as every other table: RLS on, a single private.is_member()
-- policy, CRUD granted to `authenticated` only (never `anon`). Offline-first
-- specifics (client-supplied uuid, client-owned `updated_at`, the
-- last_write_wins trigger) as in the dates migration.
-- =============================================================================

create table trips (
  id uuid primary key default gen_random_uuid(),
  title text not null check (length(title) > 0),
  -- Both null for a trip that exists before its dates do.
  starts_on date,
  ends_on date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table trips enable row level security;

create policy "Members have full access to trips" on trips
  for all to authenticated using (private.is_member()) with check (private.is_member());

revoke all on public.trips from anon, authenticated;
grant select, insert, update, delete on public.trips to authenticated;

create trigger last_write_wins before update on public.trips
  for each row execute function private.last_write_wins();

create table trip_items (
  id uuid primary key default gen_random_uuid(),
  trip_id uuid not null references trips (id) on delete cascade,
  kind text not null check (kind in ('todo', 'ticket', 'lodging', 'booking', 'place')),
  title text not null check (length(title) > 0),
  -- The day something starts, and the hour when the class has one.
  on_date date,
  at_time time,
  ends_on date,
  ends_at time,
  -- IATA codes, a pasaje's only.
  from_code text,
  to_code text,
  -- Only a 'todo' is ever ticked.
  done boolean not null default false,
  comments text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table trip_items enable row level security;

create policy "Members have full access to trip_items" on trip_items
  for all to authenticated using (private.is_member()) with check (private.is_member());

revoke all on public.trip_items from anon, authenticated;
grant select, insert, update, delete on public.trip_items to authenticated;

create trigger last_write_wins before update on public.trip_items
  for each row execute function private.last_write_wins();

-- A trip row's pictures are attachments owned by it. They are fetched on demand
-- like a chore's; keeping every file on every device stays documents-only.
alter table attachments drop constraint attachments_owner_kind_check;
alter table attachments add constraint attachments_owner_kind_check
  check (owner_kind in ('chore', 'document', 'note', 'trip_item'));
