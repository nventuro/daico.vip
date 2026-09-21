-- =============================================================================
-- Migration: a pasaje says what it travels on.
--
-- A pasaje is a flight, a train or a bus, and nothing in the row said which:
-- a flight was read off its two airport codes, and everything else was taken
-- for a bus. `transport` says it outright, on a row of a trip and on a staged
-- one alike, null for every class that is no pasaje. It is what gives the row
-- its icon and what makes a flight a flight — the one that has boarding
-- passes — so where a pasaje leaves from and arrives no longer has to be a
-- code: the two columns are renamed for what they now hold, an IATA code on a
-- flight and the station's or the terminal's name otherwise.
--
-- Every pasaje there is gets the transport it was being read as: a flight
-- with both codes, a bus without. A train among them is set right by hand.
-- `updated_at` is left alone, so the values come down with the next pull.
-- =============================================================================

alter table trip_items rename column from_code to origin;
alter table trip_items rename column to_code to destination;
alter table trip_items add column transport text
  check (transport in ('flight', 'train', 'bus'));

update trip_items
  set transport = case
    when origin is not null and destination is not null then 'flight'
    else 'bus'
  end
  where kind = 'ticket';

alter table trip_inbox rename column from_code to origin;
alter table trip_inbox rename column to_code to destination;
alter table trip_inbox add column transport text
  check (transport in ('flight', 'train', 'bus'));

update trip_inbox
  set transport = case
    when kind = 'boarding_pass' then 'flight'
    when origin is not null and destination is not null then 'flight'
    else 'bus'
  end
  where kind in ('ticket', 'boarding_pass');
