-- =============================================================================
-- Harden is_member(): move it out of the API-exposed `public` schema.
--
-- A SECURITY DEFINER helper in `public` is reachable over PostgREST at
-- /rest/v1/rpc/is_member, and Postgres grants EXECUTE to PUBLIC by default, so
-- even the anon role can call it. The function is only needed (a) inside RLS
-- policies and (b) for the client to check its own membership.
--
-- Moving it to a non-exposed `private` schema removes the public RPC endpoint
-- entirely (PostgREST only exposes `public`), while keeping it usable by RLS.
-- The client now derives membership from whether it can read `members`.
-- =============================================================================

create schema if not exists private;
grant usage on schema private to authenticated;

create or replace function private.is_member()
returns boolean language sql security definer stable
set search_path = '' as $$
  select exists (
    select 1 from public.members
    where email = auth.jwt() ->> 'email'
  )
$$;

grant execute on function private.is_member() to authenticated;

-- Repoint existing policies to the private helper.
drop policy "Members can read members" on public.members;
create policy "Members can read members" on public.members
  for select to authenticated using (private.is_member());

drop policy "Members have full access to chores" on public.chores;
create policy "Members have full access to chores" on public.chores
  for all to authenticated using (private.is_member()) with check (private.is_member());

-- Remove the exposed public function (no longer referenced).
drop function public.is_member();
