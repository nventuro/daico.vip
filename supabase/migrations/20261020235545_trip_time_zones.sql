-- =============================================================================
-- Migration: a train or a bus says what time zone each of its ends is in.
--
-- A pasaje's hours are each local to where they happen, so how long it takes
-- is the two hours read each in its own zone. A flight's zones come from its
-- airports; a station is a name, and nothing says where it is. The email
-- worker, which knows the station the booking names, stages each end's zone
-- (an IANA name, «Europe/London») in `origin_time_zone` and
-- `destination_time_zone`, and confirming carries them onto the row of the
-- trip. Every other row leaves them null, and so does a pasaje typed by hand,
-- which says no duration.
-- =============================================================================

alter table trip_items
  add column origin_time_zone text,
  add column destination_time_zone text;

alter table trip_inbox
  add column origin_time_zone text,
  add column destination_time_zone text;
