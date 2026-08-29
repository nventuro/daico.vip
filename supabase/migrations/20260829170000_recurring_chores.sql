-- =============================================================================
-- Migration: chores that repeat, and one way of saying how anything repeats.
--
-- A chore that repeats is the SAME ROW coming back, never a new one. Marking it
-- writes the day it was marked and moves `due_on` on to the next occurrence, so
-- two devices marking the same chore with no connection write the same two
-- columns and last-write-wins settles it — where creating the next chore would
-- have left two. Nothing is ever written on the app's own initiative: time
-- passing changes what is read, not what is stored.
--
-- `done` goes. It was exactly `last_done_on is not null and repeat_every is
-- null` — a chore that repeats is never done, it is up to date — so keeping
-- both would have meant two columns to agree with each other on every write.
-- The backfill reads the day off `updated_at`: on a chore that was marked and
-- then left alone, the last edit IS the day it was marked. It is taken in UTC,
-- which can be a day out for a chore marked late at night; that date is only
-- ever shown, never counted from, and only for chores already finished.
--
-- Both tables now describe a repetition the same way — `repeat_every` +
-- `repeat_unit`, all-or-nothing — so the arithmetic lives in one place
-- (src/utils/recurrence.ts) instead of once per app. `dates` loses
-- `repeat`/`repeat_months`, which said the same thing in fewer units: a date
-- could only repeat yearly or every N months, while a chore has to be able to
-- come back every 3 days.
--
-- `repeat_from` is the one column chores have and dates do not: a date is never
-- done, so there is nothing to count from but the calendar.
--
-- RLS, the private.is_member() policy, the authenticated grants and the
-- last_write_wins trigger are all unaffected — none of them names a column.
-- =============================================================================

-- ─── chores ──────────────────────────────────────────────────────────────────

alter table chores add column last_done_on date;
alter table chores add column repeat_every integer;
alter table chores add column repeat_unit text;
alter table chores add column repeat_from text;

update chores set last_done_on = (updated_at at time zone 'UTC')::date where done;

alter table chores drop column done;

alter table chores add constraint chores_repeat_unit_check
  check (repeat_unit is null or repeat_unit in ('day', 'week', 'month', 'year'));
alter table chores add constraint chores_repeat_from_check
  check (repeat_from is null or repeat_from in ('due', 'done'));
alter table chores add constraint chores_repeat_every_check
  check (repeat_every is null or repeat_every > 0);

-- The three describe one thing, so a row either has all of them or none.
alter table chores add constraint chores_repeat_all_or_nothing
  check ((repeat_every is null) = (repeat_unit is null)
     and (repeat_every is null) = (repeat_from is null));

-- Something that comes back has to come back on a day.
alter table chores add constraint chores_repeat_needs_a_date
  check (repeat_every is null or due_on is not null);

-- ─── dates ───────────────────────────────────────────────────────────────────

alter table dates add column repeat_every integer;
alter table dates add column repeat_unit text;

update dates set repeat_every = 1, repeat_unit = 'year' where repeat = 'yearly';
update dates set repeat_every = repeat_months, repeat_unit = 'month'
  where repeat = 'months' and repeat_months is not null and repeat_months > 0;

alter table dates drop column repeat;
alter table dates drop column repeat_months;

alter table dates add constraint dates_repeat_unit_check
  check (repeat_unit is null or repeat_unit in ('day', 'week', 'month', 'year'));
alter table dates add constraint dates_repeat_every_check
  check (repeat_every is null or repeat_every > 0);
alter table dates add constraint dates_repeat_all_or_nothing
  check ((repeat_every is null) = (repeat_unit is null));
