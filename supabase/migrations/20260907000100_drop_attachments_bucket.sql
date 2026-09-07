-- =============================================================================
-- Migration: drop the attachments bucket.
--
-- The attachment files live in R2 now, behind the files worker, and no build
-- that wrote to this bucket is still running — dropped one deploy after the
-- code stopped using it, like a column. With the bucket gone, no policy on
-- storage.objects has anything to gate.
--
-- The storage tables refuse a plain delete: a row deleted from storage.objects
-- leaves its file behind in the store, and the guard exists so that never
-- happens by accident. Deleting an empty bucket leaves nothing behind, so the
-- guard is switched off for this one statement — and the objects' foreign key
-- still refuses it while an object remains, which is the point: the bucket is
-- emptied through the Storage API or the dashboard first, never by deleting
-- rows. On a project where it was already deleted that way, this deletes
-- nothing.
-- =============================================================================

drop policy if exists "Members have full access to attachment files" on storage.objects;

set storage.allow_delete_query = 'true';
delete from storage.buckets where id = 'attachments';
