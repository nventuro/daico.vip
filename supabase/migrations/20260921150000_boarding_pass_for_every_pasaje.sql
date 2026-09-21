-- =============================================================================
-- Migration: a staged pasaje says which of its files are boarded with.
--
-- A boarding pass is what is shown to board, whatever the pasaje travels on:
-- an airline issues it at check-in, in an email of its own, while a train's
-- or a bus's usually comes with the booking itself. So a staged pasaje may
-- bring its boarding passes along, and has to say which of its files they
-- are: those go on the pasaje's boarding-pass shelf at confirm, the rest
-- among its other files. A staged boarding pass — the row of that kind —
-- lists nothing but passes, in either column.
-- =============================================================================

alter table trip_inbox add column boarding_pass_file_ids text not null default '[]'
  check (jsonb_typeof(boarding_pass_file_ids::jsonb) = 'array');
