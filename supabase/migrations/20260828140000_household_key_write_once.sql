-- =============================================================================
-- Migration: the household key is written once.
--
-- The single household_key row holds the wrapped master key that every
-- attachment and every statement is read through. The app writes it once, when
-- the first member sets the phrase, and never again. Until now a member session
-- could nevertheless update it, and an update that replaced the wrapped key
-- would leave every file and every statement unreadable on every device that
-- does not already hold the key — with nothing to recover it from.
--
-- So take the privilege away and say the same thing twice: no `update` grant,
-- and policies that only allow reading it and writing the first one. The unique
-- index still makes a racing second insert fail rather than leave two keys.
-- =============================================================================
revoke update on public.household_key from authenticated;

drop policy "Members have full access to household_key" on public.household_key;

create policy "Members can read the household key" on public.household_key
  for select to authenticated using (private.is_member());

create policy "Members can write the first household key" on public.household_key
  for insert to authenticated with check (private.is_member());
