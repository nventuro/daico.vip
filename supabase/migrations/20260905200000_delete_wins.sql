-- =============================================================================
-- Migration: a delete wins, whenever the edit it beats is pushed.
--
-- Conflicts resolve by last-write-wins on `updated_at`, and a delete is meant
-- to win over any edit of the row. But the push of a delete is a plain delete
-- and the push of an edit a plain upsert, so a device that edited a row
-- offline and pushed after another device had deleted it put the row back for
-- everyone: what really won was whichever was pushed last.
--
-- Now every deletion the app makes is written down — `deleted_rows`, kept by
-- an after-delete trigger — and a before-insert trigger takes no row of an id
-- deleted before. Skipped, not rejected, like a stale update: the upsert
-- still reports success, the client clears its queue, and its next pull, not
-- finding the row, drops the copy it kept. An id is never used again (a row
-- put back by an undo is a new row), so nothing legitimate is turned away.
-- The record is never pruned: a row of it is an id and a time, and it is what
-- keeps a device that comes back after months from putting a row back.
--
-- Only the tables the app may delete from carry the pair. Where the app never
-- deletes there is no such race — and the guides importer replaces a guide
-- under the same id, which a record of its deletion would refuse.
--
-- Both functions are SECURITY DEFINER in `private` with search_path pinned,
-- like every helper: the record is written and read on the app's behalf, so
-- no role needs a grant on it to write a table. Members may read it, so a
-- device could one day be told what was deleted rather than notice.
-- =============================================================================

create table deleted_rows (
  table_name text not null,
  id uuid not null,
  deleted_at timestamptz not null default now(),
  primary key (table_name, id)
);

alter table deleted_rows enable row level security;

create policy "Members can read deleted_rows" on deleted_rows
  for select to authenticated using (private.is_member());

revoke all on public.deleted_rows from anon, authenticated;
grant select on public.deleted_rows to authenticated;

create or replace function private.record_deletion()
returns trigger language plpgsql security definer
set search_path = '' as $$
begin
  insert into public.deleted_rows (table_name, id) values (tg_table_name, old.id)
  on conflict do nothing;
  return old;
end;
$$;

create or replace function private.delete_wins()
returns trigger language plpgsql security definer
set search_path = '' as $$
begin
  if exists (
    select 1 from public.deleted_rows d
    where d.table_name = tg_table_name and d.id = new.id
  ) then
    return null;
  end if;
  return new;
end;
$$;

-- Only ever invoked by the triggers below, never called directly, so no role
-- holds execute on either (firing a trigger needs none).
revoke execute on function private.record_deletion() from public;
revoke execute on function private.delete_wins() from public;

-- Every table the app may delete from, as of this migration; a table that
-- gains that privilege later adds the pair in its own.
do $$
declare
  t text;
begin
  for t in
    select c.relname
    from pg_class c join pg_namespace n on n.oid = c.relnamespace
    where n.nspname = 'public' and c.relkind = 'r'
      and has_table_privilege('authenticated', c.oid, 'DELETE')
    order by c.relname
  loop
    execute format(
      'create trigger delete_wins before insert on public.%I '
      'for each row execute function private.delete_wins()', t);
    execute format(
      'create trigger record_deletion after delete on public.%I '
      'for each row execute function private.record_deletion()', t);
  end loop;
end $$;
