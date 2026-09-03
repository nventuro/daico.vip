-- =============================================================================
-- Migration: an attachment is a picture or a PDF.
--
-- The app takes PDFs again — a lab result, a policy — asked for through the
-- device's file chooser on their own and drawn page by page on the device, so
-- the row's type check follows. Nothing else changes: the bucket still takes
-- the sealed blob as octet-stream, under the same size limit.
-- =============================================================================

alter table attachments drop constraint attachments_mime_check;
alter table attachments add constraint attachments_mime_check
  check (mime in ('image/jpeg', 'image/png', 'image/webp', 'image/gif', 'application/pdf'));
