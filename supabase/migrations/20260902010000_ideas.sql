-- =============================================================================
-- Migration: ideas (offline-first), filed under groups.
--
-- An idea is a title, the group it is filed under and a body in the app's
-- markdown dialect, all in the clear like a recipe: it is where the household
-- keeps what to try and where to go, not where a secret is written down.
--
-- A group is a column, not a table. A group is whatever ideas name it, so it
-- exists exactly as long as one of them does: there is no row that could be
-- left without ideas, by the schema rather than by a trigger. A table of
-- groups with a cascading foreign key would not survive the offline model —
-- one device deletes a group's last idea and the server drops the group,
-- another adds to that group without a connection, and its row is then refused
-- for good when it syncs. With the column, that idea simply brings the group
-- back.
--
-- Same security model as every other table: RLS on, a single private.is_member()
-- policy, CRUD granted to `authenticated` only (never `anon`). Offline-first
-- specifics (client-supplied uuid, client-owned `updated_at`, the
-- last_write_wins trigger) as in the dates migration.
-- =============================================================================

create table ideas (
  id uuid primary key default gen_random_uuid(),
  title text not null check (length(title) > 0),
  -- The group the idea is filed under; a group is the ideas that name it.
  group_name text not null check (length(group_name) > 0),
  -- An idea is often only its title, so an empty body is a valid row.
  body text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table ideas enable row level security;

create policy "Members have full access to ideas" on ideas
  for all to authenticated using (private.is_member()) with check (private.is_member());

revoke all on public.ideas from anon, authenticated;
grant select, insert, update, delete on public.ideas to authenticated;

create trigger last_write_wins before update on public.ideas
  for each row execute function private.last_write_wins();

-- An idea's pictures are attachments owned by it. They are fetched on demand
-- like a chore's; keeping every file on every device stays documents-only.
alter table attachments drop constraint attachments_owner_kind_check;
alter table attachments add constraint attachments_owner_kind_check
  check (owner_kind in ('chore', 'document', 'note', 'trip_item', 'idea'));
