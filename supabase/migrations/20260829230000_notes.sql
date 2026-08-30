-- =============================================================================
-- Migration: notes (offline-first), sealed, and attachments on them.
--
-- A note is a title and a body written in the app's markdown dialect. The body
-- never reaches the server in the clear: like a statement's payload, it is
-- compressed and then encrypted under a key of its own, wrapped under the
-- household's master key (`wrapped_key`), and carried as base64 in `body`. The
-- server therefore holds a title, two timestamps and an opaque blob — which is
-- also why search only ever matches the title.
--
-- The title stays in the clear deliberately: it is what lists the note and what
-- Buscar matches, and neither can be done over ciphertext.
--
-- Same security model as every other table: RLS on, a single private.is_member()
-- policy, CRUD granted to `authenticated` only (never `anon`). Offline-first
-- specifics (client-supplied uuid, client-owned `updated_at`, the
-- last_write_wins trigger) as in the dates migration.
-- =============================================================================

create table notes (
  id uuid primary key default gen_random_uuid(),
  title text not null check (length(title) > 0),
  -- Base64 of the sealed body, and the key that opens it wrapped under the
  -- household's master key. Both always set: an empty note seals an empty body.
  body text not null,
  wrapped_key text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table notes enable row level security;

create policy "Members have full access to notes" on notes
  for all to authenticated using (private.is_member()) with check (private.is_member());

revoke all on public.notes from anon, authenticated;
grant select, insert, update, delete on public.notes to authenticated;

create trigger last_write_wins before update on public.notes
  for each row execute function private.last_write_wins();

-- A note's pictures are attachments owned by it. They are fetched on demand
-- like a chore's; keeping every file on every device stays documents-only.
alter table attachments drop constraint attachments_owner_kind_check;
alter table attachments add constraint attachments_owner_kind_check
  check (owner_kind in ('chore', 'document', 'note'));
