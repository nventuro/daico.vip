-- =============================================================================
-- Migration: the PDFs an email brings, sealed for the household.
--
-- A forwarded confirmation usually carries the booking as a PDF. The worker
-- that stages the email's rows keeps those PDFs too, but it holds nothing that
-- opens a file and must never get it: so the household publishes a key pair,
-- the worker seals every PDF it keeps to the public half, and only a device
-- holding the master key — under which the private half is sealed, exactly as
-- a file is — can open one. The server holds ciphertext either way.
--
-- inbox_key: the pair, one row per household like household_key, written once
-- by the first device that holds the master key and finds none. The public
-- half is what the worker reads; the private half beside it is sealed under
-- the master key in the attachment file format, with the file key that sealed
-- it wrapped the way a note's body key is. Members may only read it and write
-- the first one; the unique index makes a racing second write fail.
--
-- trip_inbox_files: the sealed PDFs of one email, under the same import_id as
-- its rows, base64 text because the worker's only way in is Postgres. Never
-- synced as a table — a row is megabytes — but fetched whole into a local
-- table after a sync, so a group is confirmed offline. Deleted by the app once
-- the rows are confirmed for good or discarded. No updated_at: a file is
-- written once and never edited, so there is nothing for last-write-wins to
-- order.
--
-- trip_inbox.file_ids: which files a staged row was printed in, a JSON list of
-- their ids in a text column. The engine carries scalars only; the list is
-- written once by the worker and copied whole when an undo re-stages the row.
--
-- The worker's role gains exactly two privileges: reading the key and
-- inserting files. db:verify pins both, and the policy shapes.
-- =============================================================================

create table inbox_key (
  id uuid primary key default gen_random_uuid(),
  -- SPKI, base64.
  public_key text not null check (length(public_key) > 0),
  -- PKCS#8, sealed under the master key in the attachment file format, base64.
  private_key text not null check (length(private_key) > 0),
  -- The file key that sealed it, wrapped under the master key, base64.
  wrapped_key text not null check (length(wrapped_key) > 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index inbox_key_single on inbox_key ((true));

alter table inbox_key enable row level security;

create policy "Members can read the inbox key" on inbox_key
  for select to authenticated using (private.is_member());

create policy "Members can write the first inbox key" on inbox_key
  for insert to authenticated with check (private.is_member());

create policy "Inbox writer can read inbox_key" on inbox_key
  for select to trip_inbox_writer using (true);

revoke all on public.inbox_key from anon, authenticated;
grant select, insert on public.inbox_key to authenticated;
grant select on public.inbox_key to trip_inbox_writer;

create trigger last_write_wins before update on public.inbox_key
  for each row execute function private.last_write_wins();

create table trip_inbox_files (
  id uuid primary key,
  -- Shared with the rows of the email it came in.
  import_id uuid not null,
  -- The attachment's name as it came, extension off; '' when it had none.
  name text not null default '',
  -- Of the PDF itself, before sealing.
  size integer not null check (size > 0),
  -- The sealed file, base64.
  data text not null check (length(data) > 0),
  -- Its file key, wrapped under the inbox public key, base64.
  wrapped_key text not null check (length(wrapped_key) > 0),
  created_at timestamptz not null default now()
);

create index trip_inbox_files_import on trip_inbox_files (import_id);

alter table trip_inbox_files enable row level security;

create policy "Members have full access to trip_inbox_files" on trip_inbox_files
  for all to authenticated using (private.is_member()) with check (private.is_member());

create policy "Inbox writer can insert into trip_inbox_files" on trip_inbox_files
  for insert to trip_inbox_writer with check (true);

revoke all on public.trip_inbox_files from anon, authenticated;
grant select, delete on public.trip_inbox_files to authenticated;
grant insert on public.trip_inbox_files to trip_inbox_writer;

alter table trip_inbox add column file_ids text not null default '[]'
  check (jsonb_typeof(file_ids::jsonb) = 'array');
