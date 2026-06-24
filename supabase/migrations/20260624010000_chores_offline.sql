-- =============================================================================
-- Migration: move chores onto the offline-first model (matching shopping_items).
--
-- Two changes, same rationale as shopping_items:
--   - Add `updated_at`, the client-owned last-write-wins key. As with
--     shopping_items there is intentionally NO trigger bumping it on update: an
--     edit made offline must keep its edit-time timestamp so a later edit on
--     another device wins, regardless of when each one happens to sync.
--   - Switch the primary key from a server-generated bigint identity to a
--     client-supplied UUID, so a chore created offline has a stable id before it
--     ever reaches the server. Existing rows get fresh UUIDs; nothing references
--     chores.id, so this is safe.
--
-- RLS, the private.is_member() policy, and the authenticated grants are all
-- unaffected (none reference the id column or its type).
-- =============================================================================

alter table chores add column updated_at timestamptz not null default now();

alter table chores add column new_id uuid not null default gen_random_uuid();
alter table chores drop column id;            -- also drops the old bigint primary key
alter table chores rename column new_id to id;
alter table chores add primary key (id);
