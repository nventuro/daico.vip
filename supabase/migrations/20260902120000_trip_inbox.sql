-- =============================================================================
-- Migration: trip_inbox — what the email pipeline stages for review.
--
-- A member forwards a booking email to the household's address; a worker
-- outside the app reads it, has a model extract the bookings, and inserts one
-- row here per extracted item. Nothing enters `trips` / `trip_items` directly:
-- a member reviews the suggestions in the app, confirming creates the real
-- rows through the normal offline engine, and the staged rows are deleted.
--
-- The rows one email produced share an `import_id` and are reviewed as a
-- group; the email's subject rides along so the review screen can say where a
-- suggestion came from. `trip_title` is the model's name for the trip the
-- items belong to — the reviewer matches it to a real trip or creates one.
-- The item columns mirror `trip_items`, minus `trip_id` and `done`, which
-- only exist once a real row does, and `kind` allows only what a confirmation
-- email can contain: no `todo`, no `place`.
--
-- The worker is not a member and never holds the service key: it connects as
-- `trip_inbox_writer`, a dedicated login role whose whole reach is inserting
-- here and reading `members` (its sender gate). Its password is set
-- operationally, never in a migration, so no secret lands in the repo. RLS
-- still applies to the role, hence the two narrow policies; db:verify pins
-- the role's grants, its attributes, and both policy shapes.
--
-- Members' own access, the grants, and the last_write_wins trigger follow the
-- standard offline-first table rules.
-- =============================================================================

create table trip_inbox (
  id uuid primary key default gen_random_uuid(),
  -- Shared by the rows one email produced.
  import_id uuid not null,
  email_subject text not null,
  -- The model's name for the trip these items belong to.
  trip_title text not null check (length(trip_title) > 0),
  kind text not null check (kind in ('ticket', 'lodging', 'booking')),
  title text not null check (length(title) > 0),
  on_date date,
  at_time time,
  ends_on date,
  ends_at time,
  from_code text,
  to_code text,
  comments text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table trip_inbox enable row level security;

create policy "Members have full access to trip_inbox" on trip_inbox
  for all to authenticated using (private.is_member()) with check (private.is_member());

revoke all on public.trip_inbox from anon, authenticated;
grant select, insert, update, delete on public.trip_inbox to authenticated;

create trigger last_write_wins before update on public.trip_inbox
  for each row execute function private.last_write_wins();

-- The worker's role. Roles are cluster-wide, unlike the objects migrations
-- normally create, hence the create-if-absent guard.
do $$
begin
  if not exists (select 1 from pg_roles where rolname = 'trip_inbox_writer') then
    create role trip_inbox_writer login;
  end if;
end
$$;

grant usage on schema public to trip_inbox_writer;
grant insert on public.trip_inbox to trip_inbox_writer;
grant select on public.members to trip_inbox_writer;

create policy "Inbox writer can insert into trip_inbox" on trip_inbox
  for insert to trip_inbox_writer with check (true);

create policy "Inbox writer can read members" on members
  for select to trip_inbox_writer using (true);
