-- =============================================================================
-- Migration: a checkup's attachments.
--
-- A checkup carries files the way a chore does: the orden to bring, the
-- confirmation of the turno — what the check needs, never what it found,
-- which is a health record's. A checkup that repeats keeps them from one
-- time to the next, as a chore keeps its pictures: they are about the check,
-- not about one occurrence of it.
-- =============================================================================

alter table attachments drop constraint attachments_owner_kind_check;
alter table attachments add constraint attachments_owner_kind_check
  check (owner_kind in ('chore', 'document', 'note', 'trip_item', 'idea', 'checkup', 'health_record', 'boarding_pass'));
