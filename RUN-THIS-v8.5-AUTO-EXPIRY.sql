-- ⁅𝐓𝐡𝐲𝐓☣︎𝐱𝐢𝐜𝐆𝐚𝐦𝐞𝐫⁆ automatic awaiting-request expiration v8.5

alter table public.game_requests
add column if not exists expired_at timestamptz;

create index if not exists game_requests_payment_expiration_idx
on public.game_requests (payment_deadline)
where status = 'awaiting_payment';

create or replace function public.expire_awaiting_game_requests()
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  expired_count integer := 0;
begin
  update public.game_requests
  set status = 'expired', expired_at = now()
  where status = 'awaiting_payment'
    and payment_deadline is not null
    and payment_deadline <= now();

  get diagnostics expired_count = row_count;
  return expired_count;
end;
$$;

revoke all on function public.expire_awaiting_game_requests() from public;

create extension if not exists pg_cron;

do $$
declare
  existing_job record;
begin
  for existing_job in
    select jobid from cron.job where jobname = 'expire-awaiting-game-requests'
  loop
    perform cron.unschedule(existing_job.jobid);
  end loop;
end;
$$;

select cron.schedule(
  'expire-awaiting-game-requests',
  '*/5 * * * *',
  $cron$select public.expire_awaiting_game_requests();$cron$
);

select public.expire_awaiting_game_requests();
notify pgrst, 'reload schema';
