-- =============================================================================
-- Migration: the backup digest is over a table's rows, not its stamps.
--
-- The guides importer keeps a table the app never writes and never syncs,
-- guide_images, without an updated_at: an image is replaced under its id
-- with nothing to say so but its bytes. A digest over ids and stamps has
-- nothing to read there, and would miss a replaced image where it did. So
-- the digest is over the rows themselves, each as JSON, in their own order —
-- what the backup writes, hashed where it lives, for any table at all.
-- =============================================================================

create or replace function private.backup_digest(schema_name text, table_name text)
returns text language plpgsql security definer stable
set search_path = '' as $$
declare
  digest text;
begin
  if schema_name <> 'public' then
    raise exception 'not a backed-up table: %.%', schema_name, table_name;
  end if;
  execute format(
    'select md5(coalesce(string_agg(to_jsonb(t)::text, %L order by to_jsonb(t)::text), %L)) from %I.%I t',
    ',', '', schema_name, table_name)
  into digest;
  return digest;
end
$$;
