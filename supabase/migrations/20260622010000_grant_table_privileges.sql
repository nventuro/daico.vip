-- =============================================================================
-- Grant base table privileges to the `authenticated` role.
--
-- RLS is a FILTER on top of SQL privileges, not a replacement for them. A role
-- with an RLS policy but no GRANT still gets "permission denied for table ..."
-- before any policy is evaluated. Enabling RLS + writing policies (as the
-- earlier migrations did) is therefore not enough on its own.
--
-- We grant to `authenticated` only — never `anon` — so anon stays fully locked
-- out, and authenticated non-members are still reduced to zero rows by the
-- private.is_member() policies.
-- =============================================================================

-- Members: the client reads this to detect membership. Rows are only ever
-- inserted/edited manually via the SQL editor (as a privileged role), so
-- authenticated needs SELECT only.
grant select on public.members to authenticated;

-- Chores: full CRUD for members (RLS still gates every row by is_member()).
grant select, insert, update, delete on public.chores to authenticated;
