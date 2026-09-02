-- Ver. 10.9: completed requested streams and permanent public VOD records.
-- Run this entire file once in the Supabase SQL Editor after v10.8.

alter table public.game_requests
  add column if not exists completed_at timestamptz,
  add column if not exists completed_by uuid references auth.users(id) on delete set null,
  add column if not exists youtube_vod_url text,
  add column if not exists twitch_vod_url text,
  add column if not exists twitch_vod_expires_at timestamptz;

create index if not exists game_requests_completed_at_idx
  on public.game_requests (completed_at desc)
  where completed_at is not null;

create table if not exists public.completed_request_vods (
  id uuid primary key default gen_random_uuid(),
  request_id uuid unique references public.game_requests(id) on delete set null,
  game_title text not null,
  platform text not null,
  request_goal text not null check (request_goal in ('play', 'speed_run', 'completion')),
  completed_at timestamptz not null,
  youtube_vod_url text,
  twitch_vod_url text,
  twitch_vod_expires_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists completed_request_vods_completed_at_idx
  on public.completed_request_vods (completed_at desc);

alter table public.completed_request_vods
  alter column youtube_vod_url drop not null;

alter table public.completed_request_vods enable row level security;

-- Browsers never read this table directly. Public visitors receive only the
-- safe fields returned by completed_public_game_requests().
revoke all on table public.completed_request_vods from public, anon, authenticated;
grant select, insert, update, delete on table public.completed_request_vods to service_role;

create or replace function public.staff_complete_game_request(
  request_id uuid,
  completed_local text,
  youtube_vod text,
  twitch_vod text default null
)
returns public.game_requests
language plpgsql
security definer
set search_path = public
as $$
declare
  current_request public.game_requests;
  completed_request public.game_requests;
  completion_instant timestamptz;
  clean_youtube text := nullif(trim(coalesce(youtube_vod, '')), '');
  clean_twitch text := nullif(trim(coalesce(twitch_vod, '')), '');
begin
  if not public.can_review_game_requests() then
    raise exception 'Review staff access required.';
  end if;

  select * into current_request
  from public.game_requests
  where id = request_id
  for update;

  if current_request.id is null then
    raise exception 'Game request not found.';
  end if;

  if current_request.status::text <> 'approved' or current_request.paid_at is null then
    raise exception 'Only paid and approved requests can be completed.';
  end if;

  if completed_local is null or char_length(trim(completed_local)) = 0 then
    raise exception 'A completion date and time is required.';
  end if;

  begin
    completion_instant := completed_local::timestamp at time zone 'America/New_York';
  exception when others then
    raise exception 'The completion date and time is invalid.';
  end;

  if completion_instant > now() + interval '5 minutes' then
    raise exception 'The completion date cannot be in the future.';
  end if;

  if clean_youtube is null and clean_twitch is null then
    raise exception 'Add at least one valid Twitch or YouTube VOD link.';
  end if;

  if clean_twitch is not null and clean_twitch !~* '^https://(www\.)?twitch\.tv/videos/[0-9]+' then
    raise exception 'Enter a valid HTTPS Twitch VOD link.';
  end if;

  if clean_youtube is not null and clean_youtube !~* '^https://(www\.)?(youtube\.com|youtu\.be)/' then
    raise exception 'Enter a valid HTTPS YouTube VOD link.';
  end if;

  update public.game_requests
  set completed_at = completion_instant,
      completed_by = auth.uid(),
      youtube_vod_url = clean_youtube,
      twitch_vod_url = clean_twitch,
      twitch_vod_expires_at = case
        when clean_twitch is null then null
        else completion_instant + interval '60 days'
      end,
      archived_at = null
  where id = request_id
  returning * into completed_request;

  insert into public.completed_request_vods (
    request_id, game_title, platform, request_goal, completed_at,
    youtube_vod_url, twitch_vod_url, twitch_vod_expires_at
  ) values (
    completed_request.id,
    completed_request.game_title,
    coalesce(completed_request.platform, 'System not specified'),
    coalesce(completed_request.request_goal::text, 'play'),
    completion_instant,
    clean_youtube,
    clean_twitch,
    case when clean_twitch is null then null else completion_instant + interval '60 days' end
  )
  on conflict on constraint completed_request_vods_request_id_key do update set
    game_title = excluded.game_title,
    platform = excluded.platform,
    request_goal = excluded.request_goal,
    completed_at = excluded.completed_at,
    youtube_vod_url = excluded.youtube_vod_url,
    twitch_vod_url = excluded.twitch_vod_url,
    twitch_vod_expires_at = excluded.twitch_vod_expires_at,
    updated_at = now();

  return completed_request;
end;
$$;

-- Public visitors receive only the stream details and safe outbound VOD URLs.
-- Twitch URLs stop being returned automatically 60 days after completion.
create or replace function public.completed_public_game_requests(limit_count integer default 24)
returns jsonb
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(
    jsonb_agg(
      jsonb_build_object(
        'gameTitle', stream.game_title,
        'platform', stream.platform,
        'requestGoal', stream.request_goal,
        'completedAt', stream.completed_at,
        'youtubeUrl', stream.youtube_vod_url,
        'twitchUrl', case
          when stream.twitch_vod_expires_at > now() then stream.twitch_vod_url
          else null
        end
      ) order by stream.completed_at desc
    ),
    '[]'::jsonb
  )
  from (
    select game_title, platform, request_goal, completed_at,
           youtube_vod_url, twitch_vod_url, twitch_vod_expires_at
    from public.completed_request_vods
    order by completed_at desc
    limit greatest(1, least(coalesce(limit_count, 24), 100))
  ) as stream;
$$;

-- Do not advertise a request as upcoming after staff marks it complete.
create or replace function public.next_public_game_request()
returns jsonb
language sql
stable
security definer
set search_path = public
as $$
  select (
    select jsonb_build_object(
      'gameTitle', game_request.game_title,
      'platform', game_request.platform,
      'requestGoal', game_request.request_goal,
      'scheduledFor', game_request.scheduled_for
    )
    from public.game_requests as game_request
    where game_request.status = 'approved'
      and game_request.paid_at is not null
      and game_request.scheduled_for is not null
      and game_request.scheduled_for >= now()
      and game_request.completed_at is null
      and game_request.archived_at is null
    order by game_request.scheduled_for asc
    limit 1
  );
$$;

-- Completed requests enter the private Archive 30 days after completion, while
-- their separate public VOD record remains available.
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
    and greatest(
      coalesce(approved_at, denied_at, reviewed_at, created_at),
      coalesce(scheduled_for, '-infinity'::timestamptz),
      coalesce(completed_at, '-infinity'::timestamptz)
    ) < now() - interval '30 days';

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

comment on function public.completed_public_game_requests(integer) is
  'Returns only public-safe completed requested-stream details and unexpired VOD links.';

revoke all on function public.staff_complete_game_request(uuid, text, text, text) from public;
revoke all on function public.completed_public_game_requests(integer) from public;
grant execute on function public.staff_complete_game_request(uuid, text, text, text) to authenticated;
grant execute on function public.completed_public_game_requests(integer) to anon, authenticated;

notify pgrst, 'reload schema';
