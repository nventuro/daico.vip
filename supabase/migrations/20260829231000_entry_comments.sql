-- =============================================================================
-- Migration: what is written about a chore or a date is a comment.
--
-- With notes an app of their own, `notes` named three different things: the
-- app, this column on two tables, and the mark drawn on a listed entry. This
-- renames the column to `comments` on both tables, in the additive form the
-- offline model requires: add, backfill, and drop the old column in a LATER
-- migration. A device can run the previous build for a whole session, and that
-- build writes `notes`; dropping it now would fail its pushes outright.
--
-- In the window between this migration and that one, what an old build writes
-- to `notes` does not reach `comments`. Nothing is lost — the column is still
-- there to read — but the new build will not show it.
--
-- No new RLS/policy/grant: a column inherits its table's.
-- =============================================================================

alter table public.chores add column if not exists comments text;
alter table public.dates add column if not exists comments text;

-- `updated_at` is bumped deliberately, as in the shopping_position backfill:
-- this genuinely makes each row its newest version, and the bump is what
-- carries the value to already-synced clients, whose last-write-wins pull only
-- takes a strictly newer row. Run once every device has synced its pending
-- changes, so no unsynced offline edit predates it.
update public.chores set comments = notes, updated_at = now()
  where notes is not null and comments is null;
update public.dates set comments = notes, updated_at = now()
  where notes is not null and comments is null;
