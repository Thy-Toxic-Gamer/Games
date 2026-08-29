-- One-time repair for v9.3 regular donation notifier permissions.
-- Safe to run more than once.

grant select
  on table public.regular_donation_notifier_state
  to service_role;

grant select, insert, update, delete
  on table public.regular_donation_notifications
  to service_role;
