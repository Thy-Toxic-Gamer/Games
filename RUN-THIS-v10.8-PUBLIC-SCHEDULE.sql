-- Ver. 10.8: privacy-safe public preview for the next scheduled viewer request.
-- Run this entire file once in the Supabase SQL Editor.

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
      and game_request.archived_at is null
    order by game_request.scheduled_for asc
    limit 1
  );
$$;

comment on function public.next_public_game_request() is
  'Returns only the public-safe game, platform, request goal, and future schedule for the next paid and approved viewer request.';

revoke all on function public.next_public_game_request() from public;
grant execute on function public.next_public_game_request() to anon, authenticated;
