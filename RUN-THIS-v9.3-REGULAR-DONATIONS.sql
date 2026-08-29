-- ThyToxicGamer v9.3: regular StreamElements donation notifications.
-- Run once in the Supabase SQL Editor before deploying notify-regular-donations.

create table if not exists public.regular_donation_notifier_state (
  id boolean primary key default true check (id = true),
  started_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

insert into public.regular_donation_notifier_state (id)
values (true)
on conflict (id) do nothing;

create table if not exists public.regular_donation_notifications (
  tip_id text primary key,
  donor_name text not null,
  amount numeric not null check (amount > 0),
  currency text not null default 'USD',
  donation_message text,
  tip_created_at timestamptz not null,
  discord_sent_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists regular_donation_notifications_created_idx
  on public.regular_donation_notifications (created_at desc);

alter table public.regular_donation_notifier_state enable row level security;
alter table public.regular_donation_notifications enable row level security;

revoke all on table public.regular_donation_notifier_state from anon, authenticated;
revoke all on table public.regular_donation_notifications from anon, authenticated;

grant select on table public.regular_donation_notifier_state to service_role;
grant select, insert, update, delete
  on table public.regular_donation_notifications
  to service_role;

comment on table public.regular_donation_notifier_state is
  'Start time for regular donation monitoring. Tips before this time are ignored.';

comment on table public.regular_donation_notifications is
  'Private server-side record of StreamElements tips already announced to Discord.';
