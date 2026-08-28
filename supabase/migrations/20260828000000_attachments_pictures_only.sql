-- =============================================================================
-- Migration: an attachment is always a picture.
--
-- The app only takes pictures now — they are what a phone's photo picker hands
-- over reliably, and what can be cropped, turned and shown in the lightbox —
-- so the row's type check follows. Any row of another type must be removed
-- before this runs; the app has no way to show one.
-- =============================================================================

alter table attachments drop constraint attachments_mime_check;
alter table attachments add constraint attachments_mime_check
  check (mime in ('image/jpeg', 'image/png', 'image/webp', 'image/gif'));
