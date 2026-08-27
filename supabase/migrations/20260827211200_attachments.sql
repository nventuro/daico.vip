-- =============================================================================
-- Migration: attachments (offline-first, encrypted on the device).
--
-- An attachment is a file — a picture, a PDF — that belongs to an entry (a
-- chore, for now). Its contents never reach the server in the clear: the app
-- encrypts every file under a key of its own, wraps that key under the
-- household's master key, and the master key itself is only stored wrapped
-- under a key derived from a phrase the members hold on paper. The server keeps
-- ciphertext and wrapped keys, which are useless without the phrase.
--
-- household_key: the one wrapped master key, plus the parameters the phrase
-- goes through to derive its wrapping key. A single row per household — the
-- unique index makes a racing second setup fail instead of leaving two keys.
-- Members may update it (a phrase change re-wraps the same key) but never
-- delete it: with it gone, every attachment is unreadable.
--
-- attachments: the metadata rows, offline-synced like any table. The file bytes
-- live in the private `attachments` storage bucket under the row's id, as an
-- opaque blob; `wrapped_file_key` is what unlocks them. `owner_kind` +
-- `owner_id` say which entry the file belongs to, deliberately without a
-- foreign key: the client syncs one table at a time and a queued row would
-- otherwise be stuck behind a reference the server can't satisfy yet.
--
-- Same security model as every other table: RLS on, a single private.is_member()
-- policy, CRUD granted to `authenticated` only (never `anon`); the bucket's
-- objects are gated the same way. Offline-first specifics (client-supplied uuid,
-- client-owned `updated_at`, the last_write_wins trigger) as in the dates
-- migration.
-- =============================================================================

create table household_key (
  id uuid primary key default gen_random_uuid(),
  kdf text not null check (kdf = 'pbkdf2-sha256'),
  salt text not null check (length(salt) > 0),
  iterations integer not null check (iterations > 0),
  wrapped_master_key text not null check (length(wrapped_master_key) > 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index household_key_single on household_key ((true));

alter table household_key enable row level security;

create policy "Members have full access to household_key" on household_key
  for all to authenticated using (private.is_member()) with check (private.is_member());

revoke all on public.household_key from anon, authenticated;
grant select, insert, update on public.household_key to authenticated;

create trigger last_write_wins before update on public.household_key
  for each row execute function private.last_write_wins();

create table attachments (
  id uuid primary key default gen_random_uuid(),
  owner_kind text not null check (owner_kind in ('chore')),
  owner_id uuid not null,
  -- What the user called it; empty for an attachment left unnamed.
  name text not null default '',
  mime text not null check (mime in ('image/jpeg', 'image/png', 'image/webp', 'image/gif', 'application/pdf')),
  -- Of the file itself, before encryption.
  size integer not null check (size > 0),
  wrapped_file_key text not null check (length(wrapped_file_key) > 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index attachments_owner on attachments (owner_kind, owner_id);

alter table attachments enable row level security;

create policy "Members have full access to attachments" on attachments
  for all to authenticated using (private.is_member()) with check (private.is_member());

revoke all on public.attachments from anon, authenticated;
grant select, insert, update, delete on public.attachments to authenticated;

create trigger last_write_wins before update on public.attachments
  for each row execute function private.last_write_wins();

-- The bucket is private (no public URLs, ever) and only takes opaque blobs:
-- the real type lives in the row. The size limit is the 10 MiB the app accepts
-- plus the 29 bytes of header, nonce and tag encryption adds.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
  values ('attachments', 'attachments', false, 10485789, array['application/octet-stream']);

create policy "Members have full access to attachment files" on storage.objects
  for all to authenticated
  using (bucket_id = 'attachments' and private.is_member())
  with check (bucket_id = 'attachments' and private.is_member());
