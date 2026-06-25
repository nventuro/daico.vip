-- =============================================================================
-- Migration: manual ordering for the shopping list.
--
-- Adds `position`, a CLIENT-OWNED fractional-index sort key (base-62 strings, the
-- `fractional-indexing` scheme). Like `updated_at`, it is set by the client and
-- never generated or bumped server-side: reordering an item writes only that
-- one row's key, which keeps it a single-row, last-write-wins-friendly change.
-- There is intentionally NO trigger touching it.
--
-- No new RLS/policy/grant: a column inherits the table's RLS and the privileges
-- already granted to `authenticated` on shopping_items. Nullable so the ALTER
-- needs no default and rows inserted manually via the SQL editor stay valid
-- (a null key just sorts last; the client owns every key from here on).
-- =============================================================================

alter table public.shopping_items add column if not exists position text;

-- Backfill existing rows in their current order with the exact keys the client's
-- generateKeyBetween() emits for a fresh sequence ('a0','a1',...), so client and
-- server agree and future appends sort after them. The list holds at most a few
-- dozen items — well under the 62 single-digit keys; the guard simply leaves any
-- surplus row null (sorts last) rather than emitting an invalid key.
--
-- `updated_at` is bumped deliberately. This is a one-time backfill, not the
-- forbidden update trigger: setting `position` for the first time genuinely makes
-- this the row's newest version, and the bump is what carries it to already-
-- synced clients (their last-write-wins pull only takes a strictly newer row, and
-- a client's local column starts null after its additive ALTER). Run after every
-- device has synced its pending changes, so no unsynced offline edit is older than
-- now() and thus overwritten.
with ordered as (
  select id, row_number() over (order by created_at, id) - 1 as n
  from public.shopping_items
  where position is null
)
update public.shopping_items s
set position =
      'a' || substr('0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz', (o.n + 1)::int, 1),
    updated_at = now()
from ordered o
where s.id = o.id and o.n < 62;
