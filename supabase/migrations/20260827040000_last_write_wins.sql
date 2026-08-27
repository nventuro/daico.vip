-- =============================================================================
-- Migration: last-write-wins on push.
--
-- Conflicts resolve by last-write-wins on the client-owned `updated_at` (the
-- recipes migration explains why it is client-owned). The client's pull applies
-- only strictly newer rows. The push is a PostgREST upsert —
-- `insert … on conflict do update` — whose update would otherwise replace the
-- stored row unconditionally: an edit made offline at 10:00 and synced at 11:00
-- would overwrite another device's 10:05 edit on the server, while that device
-- kept its own newer copy, and the two would disagree until the next edit.
--
-- This trigger makes the server apply the same rule: an update whose
-- `updated_at` is older than the stored one is skipped. Skipped, not rejected —
-- the upsert still reports success, so the client clears its queue and its next
-- pull replaces the stale local copy with the newer server row; every device
-- converges on the same version. Equal timestamps still apply, so re-pushing a
-- row is never blocked. Deletes are untouched: "delete wins" stays unconditional.
--
-- The function lives in the non-exposed `private` schema like every helper,
-- with search_path pinned. It is not SECURITY DEFINER: it runs as the writing
-- user and only decides whether that user's own update goes through.
-- =============================================================================

create or replace function private.last_write_wins()
returns trigger language plpgsql
set search_path = '' as $$
begin
  if new.updated_at < old.updated_at then
    return null;
  end if;
  return new;
end;
$$;

-- Only ever invoked by the triggers below, never called directly, so no role
-- holds execute on it (firing a trigger needs none).
revoke execute on function private.last_write_wins() from public;

create trigger last_write_wins before update on public.chores
  for each row execute function private.last_write_wins();
create trigger last_write_wins before update on public.shopping_items
  for each row execute function private.last_write_wins();
create trigger last_write_wins before update on public.guides
  for each row execute function private.last_write_wins();
create trigger last_write_wins before update on public.guide_chapters
  for each row execute function private.last_write_wins();
create trigger last_write_wins before update on public.dates
  for each row execute function private.last_write_wins();
create trigger last_write_wins before update on public.recipes
  for each row execute function private.last_write_wins();
