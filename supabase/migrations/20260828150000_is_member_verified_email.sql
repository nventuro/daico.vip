-- =============================================================================
-- Migration: membership asks for a verified Google email.
--
-- is_member() matched the identity's email against the roster and left it to
-- the project's "Confirm email" setting — a switch in the dashboard, which no
-- migration can see and nothing checks — to say whether Google had verified
-- that address. Read the flag the identity itself carries instead, so the check
-- holds whatever the dashboard happens to say.
--
-- An identity with the flag missing is not a member: the app is a fixed
-- allowlist, and the answer to an unverifiable identity is no.
-- =============================================================================
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
      and coalesce((i.identity_data ->> 'email_verified')::boolean, false)
  )
$$;
