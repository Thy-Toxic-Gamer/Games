-- ⁅𝐓𝐡𝐲𝐓☣︎𝐱𝐢𝐜𝐆𝐚𝐦𝐞𝐫⁆ request choices and secure pricing v10.3
-- Run once in the Supabase SQL Editor before publishing the matching website files.
-- Safe to run again if the first run is interrupted.

begin;

alter table public.game_requests
  add column if not exists request_goal text not null default 'play';

update public.game_requests
set request_goal = 'play'
where request_goal is null;

alter table public.game_requests
  alter column request_goal set default 'play',
  alter column request_goal set not null;

alter table public.game_requests
  drop constraint if exists game_requests_request_goal_check;

alter table public.game_requests
  add constraint game_requests_request_goal_check
  check (request_goal in ('play', 'speed_run', 'completion'));

drop trigger if exists game_request_choice_price on public.game_requests;
drop function if exists public.set_game_request_choice_price();

alter table public.game_requests
  alter column minimum_amount set expression as (
    case
      when request_type = 'catalog'::game_request_type and request_goal = 'play' then 5
      when request_type = 'catalog'::game_request_type and request_goal = 'speed_run' then 10
      when request_type = 'catalog'::game_request_type and request_goal = 'completion' then 15
      when request_type = 'unlisted'::game_request_type and request_goal = 'play' then 10
      when request_type = 'unlisted'::game_request_type and request_goal = 'speed_run' then 15
      when request_type = 'unlisted'::game_request_type and request_goal = 'completion' then 20
      else null::integer
    end
  );

commit;

analyze public.game_requests;

-- Expected result:
-- catalog  + play       = $5
-- catalog  + speed_run  = $10
-- catalog  + completion = $15
-- unlisted + play       = $10
-- unlisted + speed_run  = $15
-- unlisted + completion = $20
