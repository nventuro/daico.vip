-- =============================================================================
-- Migration: an idea can be archived.
--
-- An idea that was tried, or that nobody means to try any more, is put out of
-- the way without being deleted: it leaves its group on the list for the
-- «Archivadas» at its foot, stays written on like any other, and is still
-- found by Buscar, which says where it is. One idea at a time, by whoever has
-- its page open: a group is never archived whole, since a group is only what
-- its ideas name.
--
-- The column comes in with its default and keeps it, so every idea there is
-- stays on the list and a build from before the column still writes.
-- =============================================================================

alter table ideas add column archived boolean not null default false;
