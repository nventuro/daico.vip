-- =============================================================================
-- Migration: the nightly backup's side of the database.
--
-- A job outside the database reads everything once a night and writes it,
-- sealed, somewhere nothing here can reach. What it connects as is
-- backup_reader: a role that can log in and call the three functions below,
-- and holds not one privilege on a table. The functions are SECURITY DEFINER
-- for the reason is_member() is — the role cannot see through any policy,
-- and a policy per table for it would be thirty policies to keep right — and
-- each answers one narrow question, so a credential of the role's that
-- leaked reads what the household keeps and changes nothing but the record
-- of its own runs.
--
-- backup_rows: a table's rows as JSON, for any base table in public, for the
-- two auth tables a restore needs (a checkup or a study is keyed on its
-- owner's user id, so a project rebuilt with new ids would hide them) and
-- for the applied-migrations list, which a restore checks against.
--
-- backup_digest: a hash over a table's ids and stamps, so the job can tell
-- whether a large, rarely changing table (the guides') changed without
-- reading it.
--
-- record_backup: how a run says how it went. backup_runs is an ordinary
-- synced table the app only ever reads — Ajustes shows the last copy and the
-- header marks a run that failed or stopped coming — kept to the last ninety
-- days by the function itself, so the table every device pulls stays a few
-- kilobytes; a device drops a pruned row on its next pull as it does any row
-- the server no longer has.
-- =============================================================================

create table backup_runs (
  id uuid primary key,
  started_at timestamptz not null,
  finished_at timestamptz not null,
  ok boolean not null,
  -- Where a run that failed stopped; empty for one that did not.
  stage text not null default '' check (stage in ('', 'tables', 'guides', 'upload', 'objects')),
  rows_read integer not null default 0 check (rows_read >= 0),
  -- Objects copied that night, and objects the source bucket held.
  objects_copied integer not null default 0 check (objects_copied >= 0),
  objects_total integer not null default 0 check (objects_total >= 0),
  bytes_sent bigint not null default 0 check (bytes_sent >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table backup_runs enable row level security;

create policy "Members can read backup_runs" on backup_runs
  for select to authenticated using (private.is_member());

revoke all on public.backup_runs from anon, authenticated;
grant select on public.backup_runs to authenticated;

create trigger last_write_wins before update on public.backup_runs
  for each row execute function private.last_write_wins();

-- The job's role. Roles are cluster-wide, unlike the objects migrations
-- normally create, hence the create-if-absent guard. No password: the script
-- that sets one keeps it out of the repository. A connection limit, so a
-- leaked credential cannot become an outage.
do $$
begin
  if not exists (select 1 from pg_roles where rolname = 'backup_reader') then
    create role backup_reader login;
  end if;
end
$$;

alter role backup_reader connection limit 2;

create function private.backup_rows(schema_name text, table_name text)
returns setof jsonb language plpgsql security definer stable
set search_path = '' as $$
begin
  if not (
    (schema_name = 'public' and exists (
      select 1
      from pg_catalog.pg_class c
      join pg_catalog.pg_namespace n on n.oid = c.relnamespace
      where n.nspname = 'public' and c.relname = table_name and c.relkind in ('r', 'p')))
    or (schema_name, table_name) in (
      ('auth', 'users'), ('auth', 'identities'), ('supabase_migrations', 'schema_migrations'))
  ) then
    raise exception 'not a backed-up table: %.%', schema_name, table_name;
  end if;
  return query execute format('select to_jsonb(t) from %I.%I t', schema_name, table_name);
end
$$;

create function private.backup_digest(schema_name text, table_name text)
returns text language plpgsql security definer stable
set search_path = '' as $$
declare
  digest text;
begin
  if schema_name <> 'public' then
    raise exception 'not a backed-up table: %.%', schema_name, table_name;
  end if;
  execute format(
    'select md5(coalesce(string_agg(id::text || %L || updated_at::text, %L order by id), %L)) from %I.%I',
    ':', ',', '', schema_name, table_name)
  into digest;
  return digest;
end
$$;

create function private.record_backup(run jsonb)
returns void language sql security definer volatile
set search_path = '' as $$
  insert into public.backup_runs
    (id, started_at, finished_at, ok, stage, rows_read, objects_copied, objects_total, bytes_sent,
     created_at, updated_at)
  select gen_random_uuid(), r.started_at, r.finished_at, r.ok, coalesce(r.stage, ''),
         coalesce(r.rows_read, 0), coalesce(r.objects_copied, 0), coalesce(r.objects_total, 0),
         coalesce(r.bytes_sent, 0), now(), now()
  from jsonb_populate_record(null::public.backup_runs, run) r;
  delete from public.backup_runs where finished_at < now() - interval '90 days';
$$;

revoke execute on function private.backup_rows(text, text) from public;
revoke execute on function private.backup_digest(text, text) from public;
revoke execute on function private.record_backup(jsonb) from public;
grant execute on function private.backup_rows(text, text) to backup_reader;
grant execute on function private.backup_digest(text, text) to backup_reader;
grant execute on function private.record_backup(jsonb) to backup_reader;
grant usage on schema private to backup_reader;
