-- =============================================================================
-- Migration: a statement is paid by hand.
--
-- A statement stays on the home screen until a member marks it paid, however
-- far off its due date: paying the card is the household's own act, like
-- finishing a chore. `paid` is an ordinary offline-synced column, set on the
-- device and reconciled by the row's last_write_wins trigger.
-- =============================================================================

alter table statements add column paid boolean not null default false;
