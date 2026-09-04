-- =============================================================================
-- Migration: an idea may be filed under no group.
--
-- An idea is born with nothing decided but its title, in the group of the
-- idea last written on — and while there are no ideas there is no group to
-- inherit. An empty group_name is that: no group at all, not a group with an
-- empty name. A group still exists exactly while an idea names it, and the
-- column stays not null so a row always says where it is filed.
-- =============================================================================

alter table public.ideas drop constraint ideas_group_name_check;
