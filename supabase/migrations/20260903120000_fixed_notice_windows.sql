-- =============================================================================
-- Migration: dates and documents lose their notice window.
--
-- How far ahead an entry reaches Próximo is no longer the entry's to say: it
-- is one window per app, a constant beside the app's `useUpcoming` — a week
-- for a date, six months for a document — as it has always been three days
-- for a chore and a week for a trip's pendiente. The column that held it goes.
--
-- Apply this only once the build that stopped sending `notice_days` is the one
-- every device runs: a device still on the build before pushes the column with
-- every row, and the server would refuse the row for a column it no longer
-- has. Pulls are unaffected either way — a pull asks for `*`.
-- =============================================================================

alter table dates drop column notice_days;
alter table documents drop column notice_days;
