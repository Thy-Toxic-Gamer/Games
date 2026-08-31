-- ⁅𝐓𝐡𝐲𝐓☣︎𝐱𝐢𝐜𝐆𝐚𝐦𝐞𝐫⁆ request archive retention v8.4
-- Run once in the Supabase SQL Editor before uploading the v8.4 website files.

alter table public.game_requests
  add column if not exists archived_at timestamptz;

create index if not exists game_requests_archived_at_idx
  on public.game_requests (archived_at);

create or replace function public.maintain_request_archive()
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  archived_count integer := 0;
  deleted_count integer := 0;
begin
  update public.game_requests
  set archived_at = now()
  where archived_at is null
    and status in ('approved', 'denied', 'expired', 'cancelled')
    and coalesce(approved_at, denied_at, reviewed_at, created_at)
      < now() - interval '30 days';

  get diagnostics archived_count = row_count;

  delete from public.game_requests
  where archived_at is not null
    and archived_at < now() - interval '6 months'
    and status in ('approved', 'denied', 'expired', 'cancelled');

  get diagnostics deleted_count = row_count;

  return jsonb_build_object(
    'archived', archived_count,
    'deleted', deleted_count,
    'completedAt', now()
  );
end;
$$;

revoke all on function public.maintain_request_archive() from public;

create extension if not exists pg_cron;

do $$
declare
  existing_job record;
begin
  for existing_job in
    select jobid from cron.job where jobname = 'toxic-request-retention'
  loop
    perform cron.unschedule(existing_job.jobid);
  end loop;
end;
$$;

select cron.schedule(
  'toxic-request-retention',
  '10 4 * * *',
  $cron$select public.maintain_request_archive();$cron$
);

-- Run maintenance immediately once, then the scheduled job runs daily at 04:10 UTC.
select public.maintain_request_archive();

notify pgrst, 'reload schema';
