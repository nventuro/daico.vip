-- =============================================================================
-- Migration: members is the household, and a row of Salud belongs to one of
-- them.
--
-- The pets go to the vet too: their appointments to make, their vaccine
-- certificates, the results of their studies belong in Salud beside a
-- member's own. A pet is nobody who signs in, so rather than a table of its
-- own — one more entity to name, list and keep from being left empty —
-- `members` becomes the household: one row per person, with the Google email
-- they sign in with, and one per pet, with no email at all. The membership
-- functions compare emails, and a null never matches, so a pet can neither
-- sign in nor be let in. The `display_name` the table always had is what the
-- app shows. The table is only ever edited by hand, and the app reads it
-- offline like any synced table, hence the timestamps and the guard.
--
-- Every checkup and health record then belongs to one member, by id: chosen
-- when the row is born and never changed, like its kind. `owner` goes in the
-- same migration rather than one deploy on: the build that stops sending it
-- ships with this, and the household writes nothing in Salud between the
-- push and the phones taking the update — the minutes in which a build that
-- still sent it would have its writes refused.
--
-- The policy keeps the curtain and adds the pets: a row is visible, and
-- writable, when its member is the caller — the row whose email is the
-- verified identity the session signed in with, the same join is_member()
-- makes — or when its member has no email. The other person's rows still
-- never reach the device, and `with check` is half of the point: a device
-- cannot push a row for the other person even if it tried.
-- =============================================================================

-- ─── members: the household ────────────────────────────────────────────────
-- The key becomes an id so a row can exist without an email (a pet's), and
-- the table gains what a synced table has, so the app can read it offline.
alter table public.members add column id uuid not null default gen_random_uuid();
alter table public.members drop constraint members_pkey;
alter table public.members add primary key (id);
alter table public.members alter column email drop not null;
create unique index members_email_key on public.members (lower(email))
  where email is not null;
alter table public.members add column created_at timestamptz not null default now();
alter table public.members add column updated_at timestamptz not null default now();
create trigger last_write_wins before update on public.members
  for each row execute function private.last_write_wins();

-- ─── who the caller is, and who is a pet ───────────────────────────────────
-- The caller's own row: the one whose email is the verified Google identity
-- the session signed in with — the same join private.is_member() makes.
create function private.member_id()
returns uuid language sql security definer stable
set search_path = '' as $$
  select m.id
  from public.members m
  join auth.identities i
    on lower(i.identity_data ->> 'email') = lower(m.email)
  where i.user_id = auth.uid()
    and i.provider = 'google'
    and coalesce((i.identity_data ->> 'email_verified')::boolean, false)
  limit 1
$$;
revoke execute on function private.member_id() from public;
grant execute on function private.member_id() to authenticated;

-- A member nobody signs in as.
create function private.is_pet(member uuid)
returns boolean language sql security definer stable
set search_path = '' as $$
  select exists (
    select 1 from public.members m
    where m.id = member and m.email is null
  )
$$;
revoke execute on function private.is_pet(uuid) from public;
grant execute on function private.is_pet(uuid) to authenticated;

-- ─── a row of Salud belongs to a member ────────────────────────────────────
-- No cascade: only the dashboard ever deletes a member, and one with rows
-- should refuse to go until they are gone. There is no offline race to fear,
-- since the app never writes members.
alter table public.checkups add column member_id uuid references public.members (id);
alter table public.health_records add column member_id uuid references public.members (id);

-- Today's rows are their creator's: the owner's auth user maps to the
-- members row with that email. updated_at is left alone: a device holding
-- the row takes the server's copy of the same instant once a column reads
-- differently, so no bump is needed for the value to come down.
update public.checkups c
  set member_id = m.id
  from auth.users u join public.members m on lower(m.email) = lower(u.email)
  where u.id = c.owner;
update public.health_records r
  set member_id = m.id
  from auth.users u join public.members m on lower(m.email) = lower(u.email)
  where u.id = r.owner;
-- Fails loudly if a row's owner matched no member, rather than leaving it.
alter table public.checkups alter column member_id set not null;
alter table public.health_records alter column member_id set not null;
-- A build from before the column inserts none: the row is then its
-- creator's own, as every row was until now, so the old build keeps working
-- against the new schema until the device takes the update.
alter table public.checkups alter column member_id set default private.member_id();
alter table public.health_records alter column member_id set default private.member_id();

-- ─── the policy: yours, and the pets' ──────────────────────────────────────
drop policy "Members have full access to their own checkups" on public.checkups;
create policy "Members have full access to their own and the pets' checkups"
  on public.checkups for all to authenticated
  using (private.is_member()
         and (member_id = private.member_id() or private.is_pet(member_id)))
  with check (private.is_member()
         and (member_id = private.member_id() or private.is_pet(member_id)));

drop policy "Members have full access to their own health_records" on public.health_records;
create policy "Members have full access to their own and the pets' health_records"
  on public.health_records for all to authenticated
  using (private.is_member()
         and (member_id = private.member_id() or private.is_pet(member_id)))
  with check (private.is_member()
         and (member_id = private.member_id() or private.is_pet(member_id)));

-- ─── owner goes ────────────────────────────────────────────────────────────
-- Last, once no policy names it: `member_id` says whose a row is now.
alter table public.checkups drop column owner;
alter table public.health_records drop column owner;
