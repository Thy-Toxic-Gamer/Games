-- ⁅𝐓𝐡𝐲𝐓☣︎𝐱𝐢𝐜𝐆𝐚𝐦𝐞𝐫⁆ Discord delivery health and retry log v10.7
-- Run once after the existing v10.5 request-system upgrades.

create table if not exists public.discord_notification_logs (
  id uuid primary key default gen_random_uuid(),
  event_type text not null,
  request_id uuid references public.game_requests(id) on delete set null,
  target text not null,
  webhook_key text not null,
  status text not null check (status in ('success', 'failed')),
  http_status integer,
  error_message text,
  payload jsonb,
  delivered_at timestamptz,
  retry_of uuid references public.discord_notification_logs(id) on delete set null,
  resolved_at timestamptz,
  resolved_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now()
);

create index if not exists discord_notification_logs_created_at_idx
  on public.discord_notification_logs (created_at desc);

create index if not exists discord_notification_logs_unresolved_idx
  on public.discord_notification_logs (created_at desc)
  where status = 'failed' and resolved_at is null;

alter table public.discord_notification_logs enable row level security;

-- Delivery payloads may contain private viewer/request information. Browsers
-- never read this table directly; the staff-authenticated Edge Function returns
-- only the safe status fields required by Staff Control.
revoke all on table public.discord_notification_logs from public, anon, authenticated;
grant select, insert, update, delete on table public.discord_notification_logs to service_role;

