-- Admins can generate a shareable join link without an email address. The
-- invite token is the unguessable capability; `email` is only used by the
-- emailed invite flow, so it must be nullable to support link-only invites.
alter table public.invites
  alter column email drop not null;