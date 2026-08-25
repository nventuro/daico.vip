-- =============================================================================
-- Migration: guides (imported reference documents).
--
-- A guide is a read-only document made of ordered chapters grouped into
-- sections; chapter bodies are markdown that can reference images by key.
-- Rows are written only by an import script running as `postgres`; the app
-- just reads them, so `authenticated` is granted SELECT and nothing else.
--
-- Same security model as every other table: RLS on, a single
-- private.is_member() policy, privileges for `authenticated` only (never
-- `anon`). RLS is a filter on top of privileges, so the grant is still needed.
--
-- `guides` and `guide_chapters` are offline-synced (read into the client's
-- local store), so they follow the offline conventions: a UUID primary key
-- supplied by whoever inserts the row, and a client-owned `updated_at` used as
-- the last-write-wins key — no trigger bumps it on update. `guide_images` is
-- not synced: the client fetches images one at a time as chapters are read, so
-- it carries no sync columns.
-- =============================================================================

create table guides (
  id uuid primary key default gen_random_uuid(),
  title text not null check (length(title) > 0),
  description text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table guide_chapters (
  id uuid primary key default gen_random_uuid(),
  guide_id uuid not null references guides (id) on delete cascade,
  section_title text not null,
  section_position integer not null,
  position integer not null,
  title text not null check (length(title) > 0),
  body text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index guide_chapters_guide_id_idx on guide_chapters (guide_id);

create table guide_images (
  id uuid primary key default gen_random_uuid(),
  guide_id uuid not null references guides (id) on delete cascade,
  -- The name chapter bodies use to reference the image.
  key text not null unique,
  mime text not null,
  width integer not null check (width > 0),
  height integer not null check (height > 0),
  -- Base64-encoded file contents.
  data text not null
);

create index guide_images_guide_id_idx on guide_images (guide_id);

alter table guides enable row level security;
alter table guide_chapters enable row level security;
alter table guide_images enable row level security;

create policy "Members can read guides" on guides
  for select to authenticated using (private.is_member());
create policy "Members can read guide_chapters" on guide_chapters
  for select to authenticated using (private.is_member());
create policy "Members can read guide_images" on guide_images
  for select to authenticated using (private.is_member());

-- Strip whatever the project-level default privileges auto-granted on
-- creation, then grant exactly what members need: reads only. Never anon.
revoke all on public.guides, public.guide_chapters, public.guide_images from anon, authenticated;
grant select on public.guides, public.guide_chapters, public.guide_images to authenticated;
