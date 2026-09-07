-- =============================================================================
-- Migration: a flight's boarding passes.
--
-- A boarding pass is an attachment of the pasaje it is for, kept apart from
-- the pasaje's other files under an owner kind of its own: the e-ticket a
-- forwarded confirmation brings already hangs under the row, and what the
-- home screen asks for the day before a flight is a boarding pass, not any
-- file. Nothing is added to trip_items — whether a flight still lacks one is
-- read off its airports, its day and the absence of such an attachment.
--
-- The email worker stages a forwarded boarding pass as a row of its own kind
-- in trip_inbox, which the app matches to a pasaje at review. A boarding
-- pass often comes as an image rather than a PDF, so a staged file now says
-- what it is; every file staged before this was a PDF.
-- =============================================================================

alter table attachments drop constraint attachments_owner_kind_check;
alter table attachments add constraint attachments_owner_kind_check
  check (owner_kind in ('chore', 'document', 'note', 'trip_item', 'idea', 'health_record', 'boarding_pass'));

alter table trip_inbox drop constraint trip_inbox_kind_check;
alter table trip_inbox add constraint trip_inbox_kind_check
  check (kind in ('ticket', 'lodging', 'booking', 'boarding_pass'));

alter table trip_inbox_files add column mime text not null default 'application/pdf'
  check (mime in ('application/pdf', 'image/jpeg', 'image/png', 'image/webp', 'image/gif'));
