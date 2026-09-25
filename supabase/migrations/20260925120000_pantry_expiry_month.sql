-- =============================================================================
-- Migration: a pantry item expires in a month, never on a day.
--
-- What is bought once is kept for months, and its package often prints only
-- the month anyway; a day was precision nobody needed and one more thing to
-- pick. `expires_on` now always holds the last day of the month the item
-- expires in — the day it is good through — so the month-only flag goes, and
-- the schema refuses any other day.
--
-- An item already written with a day moves to that month's last day. The
-- backfill leaves `updated_at` as it is: a device's next pull takes a server
-- row of the same instant whose columns read differently, so the new date
-- comes down on its own. Dropping the column drops the check that tied it to
-- the date.
-- =============================================================================

update pantry_items
  set expires_on = (date_trunc('month', expires_on::timestamp) + interval '1 month' - interval '1 day')::date
  where expires_on is not null;

alter table pantry_items drop column expires_month_only;

alter table pantry_items add constraint pantry_items_expires_on_month_end
  check (expires_on = (date_trunc('month', expires_on::timestamp) + interval '1 month' - interval '1 day')::date);
