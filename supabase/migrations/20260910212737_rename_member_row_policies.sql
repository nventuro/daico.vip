-- =============================================================================
-- Migration: the member-row policies under names that fit.
--
-- Postgres keeps an identifier to 63 characters, and the name the previous
-- migration gave the health_records policy ran past that, so it was stored
-- cut short. Both policies are renamed to the same shorter shape, so the two
-- read alike and the name in the database is the name in the repository.
-- Only the names change: db:verify pins what the policies say, not what
-- they are called.
-- =============================================================================

alter policy "Members have full access to their own and the pets' checkups"
  on public.checkups
  rename to "Members have full access to own and pets' checkups";

alter policy "Members have full access to their own and the pets' health_reco"
  on public.health_records
  rename to "Members have full access to own and pets' health_records";
