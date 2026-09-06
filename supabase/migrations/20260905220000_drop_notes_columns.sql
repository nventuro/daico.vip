-- =============================================================================
-- Migration: the columns `comments` replaced go.
--
-- What is written about a chore or a date has been `comments` since the
-- migration that added it, which left the old `notes` columns in place for
-- the build still writing them to finish its session. Every build since reads
-- neither, and several deploys have gone by, so the stale copies — pulled
-- onto every device by a `select *` all this time — go now.
-- =============================================================================

alter table public.chores drop column if exists notes;
alter table public.dates drop column if exists notes;
