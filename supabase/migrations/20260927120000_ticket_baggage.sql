-- =============================================================================
-- Migration: a flight says how much luggage it takes.
--
-- A pasaje on a plane comes with an allowance: so many pieces in the cabin
-- and so many in the hold, for each passenger. `carry_on_bags` and
-- `checked_bags` count them, on a row of a trip and on a staged one alike —
-- the email worker reads them off the booking. Only a flight says it: every
-- other row leaves them null, as it does every column it has no use for, and
-- so does a flight whose allowance was never said, which 0 would misread as
-- one that takes none.
-- =============================================================================

alter table trip_items
  add column carry_on_bags integer check (carry_on_bags >= 0),
  add column checked_bags integer check (checked_bags >= 0);

alter table trip_inbox
  add column carry_on_bags integer check (carry_on_bags >= 0),
  add column checked_bags integer check (checked_bags >= 0);
