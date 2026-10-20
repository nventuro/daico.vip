-- =============================================================================
-- Migration: Compras is kept by section — where a thing is bought: the
-- verdulería, the supermercado.
--
-- A section is a row of its own, not a name on the items as an idea's group
-- is: a struck item leaves the list on its own half an hour on, so a section
-- named only by its items would go with the last one bought, and the next
-- trip would start with no sections at all. It has a name and a fractional
-- `position`, so the household puts them in the order a walk through the
-- shops takes, and moving one writes one row.
--
-- An item names its section in `section_id`, null for one in none. There is
-- no foreign key, for the race Ideas' groups avoid: one device deletes a
-- section while another, offline, files an item into it — with a key, that
-- item would be refused for good when it syncs. Without one it arrives, and
-- an id that names no section is read as no section at all, which is where a
-- deleted section's items go anyway.
--
-- Same security model as every other table: RLS on, a single
-- private.is_member() policy, CRUD granted to `authenticated` only (never
-- `anon`). Offline-first specifics (client-supplied uuid, client-owned
-- `updated_at`) as in the shopping list's own migration, with the
-- last-write-wins trigger, and the delete-wins pair since the app deletes
-- from it.
-- =============================================================================

create table shopping_sections (
  id uuid primary key default gen_random_uuid(),
  name text not null check (length(name) > 0),
  position text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table shopping_sections enable row level security;

create policy "Members have full access to shopping_sections" on shopping_sections
  for all to authenticated using (private.is_member()) with check (private.is_member());

revoke all on public.shopping_sections from anon, authenticated;
grant select, insert, update, delete on public.shopping_sections to authenticated;

create trigger last_write_wins before update on public.shopping_sections
  for each row execute function private.last_write_wins();
create trigger delete_wins before insert on public.shopping_sections
  for each row execute function private.delete_wins();
create trigger record_deletion after delete on public.shopping_sections
  for each row execute function private.record_deletion();

alter table shopping_items add column section_id uuid;
