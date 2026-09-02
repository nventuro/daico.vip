-- =============================================================================
-- Migration: guides get a group and an archived flag, and the app may write
-- them.
--
-- A guide is shelved under a group (`group_name`, plain text such as the
-- author it came from) and can be archived out of the list. Both are the
-- household's: the import script names the group the first time it sees a
-- guide, and from then on a member changes the group, the title and the flag
-- from the app. The description, the chapters and the images stay the
-- import's and are only ever read.
--
-- `group_name` is a column, not a table, for the reason `ideas.group_name`
-- is: a group exists exactly while a guide names it, so it can never be left
-- empty, and two devices offline can never race over it.
--
-- The app's push is a whole-row upsert, so writing three columns takes insert
-- and update on the whole table; delete stays out — a guide is only ever
-- removed by the import. The read-only policy gives way to the usual
-- full-access one; the grants are what bound it.
-- =============================================================================

-- Rows exist, so the column comes in with a default; the import that follows
-- names every guide's group, and the default goes away with this migration.
alter table guides
  add column group_name text not null default '',
  add column archived boolean not null default false;
alter table guides alter column group_name drop default;

drop policy "Members can read guides" on guides;
create policy "Members have full access to guides" on guides
  for all to authenticated using (private.is_member()) with check (private.is_member());

grant insert, update on public.guides to authenticated;
