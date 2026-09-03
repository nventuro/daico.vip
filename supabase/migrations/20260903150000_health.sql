-- =============================================================================
-- Migration: Salud — checkups and health records, each member's own.
--
-- A checkup is a health check to have done: a chore that always comes back
-- from the day it was marked (the dentist every six months, the flu shot every
-- year), or a one-off appointment. A health record is a study kept: a blood
-- test, an X-ray, a vaccination certificate — a title, the day it was done and
-- its pictures, which are attachments and hold everything the study says.
-- Nothing links the two: a study's title and date already say which checkup
-- it came from.
--
-- Both are about one person, and that person is always a member, so every row
-- carries `owner`, the auth user id of the member who created it, and the
-- policy hands each member only their own rows: a select filters them out, a
-- write for another owner is refused. This is the one place the schema knows
-- whose a row is; `db:verify` admits this second policy shape on these two
-- tables alone. The pictures stay in `attachments`, shared like every
-- attachment under the household's one key: the other member's screens never
-- show them, since the row they hang from never reaches that device, but the
-- attachment rows themselves do sync there. A curtain, not a vault.
--
-- Otherwise the usual: RLS on, CRUD granted to `authenticated` only (never
-- `anon`), client-supplied uuid, client-owned `updated_at` and the
-- last_write_wins trigger, as in the dates migration.
-- =============================================================================

create table checkups (
  id uuid primary key default gen_random_uuid(),
  -- The member it belongs to: the auth user id of whoever created it.
  owner uuid not null,
  title text not null check (length(title) > 0),
  comments text,
  -- When it is next due; null for one with no date, which never repeats.
  due_on date,
  -- The day it was last marked. One that does not repeat and carries it is done.
  last_done_on date,
  -- How often it comes back, always counted from the day it was marked; both
  -- null when it does not.
  repeat_every integer check (repeat_every > 0),
  repeat_unit text check (repeat_unit in ('day', 'week', 'month', 'year')),
  check ((repeat_every is null) = (repeat_unit is null)),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table health_records (
  id uuid primary key default gen_random_uuid(),
  owner uuid not null,
  title text not null check (length(title) > 0),
  -- The day the study was done. What it says is in its pictures.
  on_date date not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table checkups enable row level security;
alter table health_records enable row level security;

create policy "Members have full access to their own checkups" on checkups
  for all to authenticated
  using (private.is_member() and owner = auth.uid())
  with check (private.is_member() and owner = auth.uid());
create policy "Members have full access to their own health_records" on health_records
  for all to authenticated
  using (private.is_member() and owner = auth.uid())
  with check (private.is_member() and owner = auth.uid());

revoke all on public.checkups, public.health_records from anon, authenticated;
grant select, insert, update, delete on public.checkups, public.health_records to authenticated;

create trigger last_write_wins before update on public.checkups
  for each row execute function private.last_write_wins();
create trigger last_write_wins before update on public.health_records
  for each row execute function private.last_write_wins();

-- A health record's pictures are attachments owned by it, fetched on demand
-- like a chore's; keeping every file on every device stays documents-only.
alter table attachments drop constraint attachments_owner_kind_check;
alter table attachments add constraint attachments_owner_kind_check
  check (owner_kind in ('chore', 'document', 'note', 'trip_item', 'idea', 'health_record'));
