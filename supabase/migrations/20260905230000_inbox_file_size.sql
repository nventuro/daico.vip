-- =============================================================================
-- Migration: a staged file is no larger than the app would take.
--
-- The worker keeps a PDF only up to the size the app attaches, but the table
-- took a row of any size, and every device fetches each staged file whole
-- after a sync. The check holds the table to what the worker sends: a sealed
-- file of the app's largest, base64 — 10485789 bytes of ciphertext, which
-- base64 writes as 13981052 characters.
-- =============================================================================

alter table public.trip_inbox_files
  add constraint trip_inbox_files_data_size check (length(data) <= 13981052);
