-- =============================================================================
-- Migration: the email worker's role holds a few connections at most.
--
-- The worker opens one connection per email and ends it; a credential of
-- the role's that leaked could open as many as the pooler allows. A limit
-- costs nothing and keeps a leak from becoming an outage.
-- =============================================================================

alter role trip_inbox_writer connection limit 4;
