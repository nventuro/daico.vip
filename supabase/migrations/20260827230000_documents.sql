-- =============================================================================
-- Migration: documents (offline-first), and attachments on them.
--
-- A document is a titled entry — a passport, an ID, an insurance policy — whose
-- content is its attachments: the pictures or PDFs of it, encrypted on the
-- device like every attachment. The row itself holds only what the app needs
-- to list it and to announce its expiry: a title, an optional `expires_on` and
-- the notice window (`notice_days`) that decides how far ahead of that day it
-- shows on the home screen. Deliberately nothing else: the sensitive content
-- (a number, a date of birth) stays inside the encrypted files, so the server
-- never sees it in the clear.
--
-- Same security model as every other table: RLS on, a single private.is_member()
-- policy, CRUD granted to `authenticated` only (never `anon`). Offline-first
-- specifics (client-supplied uuid, client-owned `updated_at`, the
-- last_write_wins trigger) as in the dates migration.
-- =============================================================================

create table documents (
  id uuid primary key default gen_random_uuid(),
  title text not null check (length(title) > 0),
  expires_on date,
  notice_days integer not null default 30 check (notice_days >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table documents enable row level security;

create policy "Members have full access to documents" on documents
  for all to authenticated using (private.is_member()) with check (private.is_member());

revoke all on public.documents from anon, authenticated;
grant select, insert, update, delete on public.documents to authenticated;

create trigger last_write_wins before update on public.documents
  for each row execute function private.last_write_wins();

-- A document's files are attachments owned by it.
alter table attachments drop constraint attachments_owner_kind_check;
alter table attachments add constraint attachments_owner_kind_check
  check (owner_kind in ('chore', 'document'));
