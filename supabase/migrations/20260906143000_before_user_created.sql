-- =============================================================================
-- Migration: nobody becomes a user but a member.
--
-- Signing in with Google makes a row in auth.users for whoever completes the
-- consent: the auth server writes its own tables before any policy of ours is
-- asked, so without this a stranger who reaches the login page is turned away
-- only afterwards, at the app's gate, with their email kept. The auth server
-- does ask one question first — its «before user created» hook, a function it
-- calls with the user it is about to make — and this is that function: the
-- email is a member's, or the user is not made.
--
-- It is SECURITY DEFINER for the reason is_member() is: the auth server calls
-- it as supabase_auth_admin, which cannot see through the roster's policy.
-- That role alone may call it, and it lives in private like every helper of
-- the kind. The hook itself is switched on in the dashboard (Authentication →
-- Hooks → Before User Created, pointed at this function), which no migration
-- can do.
-- =============================================================================

create function private.before_user_created(event jsonb)
returns jsonb language sql security definer stable
set search_path = '' as $$
  select case
    when exists (
      select 1 from public.members m
      where lower(m.email) = lower(event -> 'user' ->> 'email')
    ) then '{}'::jsonb
    else jsonb_build_object('error', jsonb_build_object(
      'http_code', 403,
      'message', 'This account is not a member.'
    ))
  end
$$;

revoke execute on function private.before_user_created(jsonb) from public;
grant execute on function private.before_user_created(jsonb) to supabase_auth_admin;
grant usage on schema private to supabase_auth_admin;
