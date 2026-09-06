-- =============================================================================
-- Migration: an email is staged once.
--
-- The sending server delivers a mail again when it never got the answer to
-- the first delivery — a timeout while the model read a long PDF, a failure
-- after the rows had already been committed — and the worker read it again,
-- staged its rows again and paid the model again. Now every email it stages
-- leaves a record under its Message-ID, written in the same transaction as
-- the rows: a second delivery is found here before the model is asked, and
-- one that raced the first fails on the record and is answered as staged
-- before. An email with no Message-ID has no record and is staged as often
-- as it comes.
--
-- The worker reads and writes the record; members may read it, like every
-- table. It is never edited, so it carries no updated_at and no
-- last-write-wins guard, and the app never deletes from it.
-- =============================================================================

create table trip_inbox_imports (
  -- As the email carried it, one header line's worth at most.
  message_id text primary key check (length(message_id) between 1 and 998),
  -- The import the email's rows and files were staged under.
  import_id uuid not null,
  received_at timestamptz not null default now()
);

alter table trip_inbox_imports enable row level security;

create policy "Members can read trip_inbox_imports" on trip_inbox_imports
  for select to authenticated using (private.is_member());

create policy "Inbox writer can read trip_inbox_imports" on trip_inbox_imports
  for select to trip_inbox_writer using (true);

create policy "Inbox writer can insert trip_inbox_imports" on trip_inbox_imports
  for insert to trip_inbox_writer with check (true);

revoke all on public.trip_inbox_imports from anon, authenticated;
grant select on public.trip_inbox_imports to authenticated;
grant select, insert on public.trip_inbox_imports to trip_inbox_writer;
