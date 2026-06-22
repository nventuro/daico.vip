-- =============================================================================
-- Harden the security model and make its invariants self-enforcing.
--
-- These three issues were invisible to the earlier migrations because a
-- migration describes a *delta*, not the full privilege state of the database:
--
--  1. is_member() trusted the raw JWT `email` claim, so ANY credential whose
--     email claim happened to match an allowlisted address would pass — e.g. an
--     email/password account registered for a member's address. It now
--     authorizes only when the calling user has a *Google* identity whose
--     verified email is in `members`, independent of which auth providers are
--     enabled. This also fixes a latent email case-sensitivity mismatch.
--
--  2. Supabase's project-level default privileges silently grant TRUNCATE,
--     REFERENCES, TRIGGER and MAINTAIN on every new `public` table to BOTH
--     `anon` and `authenticated`. The grant migration only ever added on top of
--     that baseline, so `anon` held privileges on `members`/`chores` despite the
--     "anon resolves to zero access" invariant. We strip everything and re-grant
--     the exact set each role needs, then ALTER the default privileges so future
--     tables stay clean without anyone having to remember to revoke.
--
--  3. is_member() had EXECUTE granted to PUBLIC (the Postgres default for any new
--     function), so `anon` nominally had execute on it (unreachable today only
--     because anon lacks USAGE on the `private` schema). Removed.
-- =============================================================================

-- ─── 1. Bind membership to a verified Google identity ─────────────────────────
-- SECURITY DEFINER (owner: postgres) so it can read auth.identities and
-- public.members regardless of the caller's RLS. search_path = '' blocks
-- search_path hijacking and forces fully-qualified names.
create or replace function private.is_member()
returns boolean language sql security definer stable
set search_path = '' as $$
  select exists (
    select 1
    from public.members m
    join auth.identities i
      on lower(i.identity_data ->> 'email') = lower(m.email)
    where i.user_id = auth.uid()
      and i.provider = 'google'
  )
$$;

-- ─── 2. Least-privilege grants on the application tables ──────────────────────
-- Revoke the surplus that default privileges auto-granted, then re-grant exactly
-- what each role needs. RLS still gates every row by private.is_member().
revoke all on public.members from anon, authenticated;
revoke all on public.chores  from anon, authenticated;

grant select on public.members to authenticated;
grant select, insert, update, delete on public.chores to authenticated;

-- Turn "never grant to anon" into a rule the database enforces: stop future
-- tables/sequences created by `postgres` in `public` (i.e. by our migrations)
-- from auto-granting anything to `anon`.
alter default privileges for role postgres in schema public
  revoke all on tables    from anon;
alter default privileges for role postgres in schema public
  revoke all on sequences from anon;

-- ─── 3. Remove the implicit PUBLIC execute grant on the helper ────────────────
revoke execute on function private.is_member() from public;
grant  execute on function private.is_member() to authenticated;
