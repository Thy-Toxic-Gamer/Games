-- Game Request owner testing and public schedule details.
-- Keeps the public release labeled Ver. 1.0.

begin;

alter table public.game_requests
  add column if not exists is_test boolean not null default false,
  add column if not exists game_summary text,
  add column if not exists release_year integer;

alter table public.game_requests
  drop constraint if exists game_requests_game_summary_length,
  drop constraint if exists game_requests_release_year_range;

alter table public.game_requests
  add constraint game_requests_game_summary_length
    check (game_summary is null or char_length(game_summary) between 30 and 1000),
  add constraint game_requests_release_year_range
    check (release_year is null or release_year between 1950 and 2100);

create or replace function public.owner_submit_test_game_request(
  request_type_text text,
  request_goal_text text,
  game_title_text text,
  platform_text text,
  viewer_note_text text,
  twitch_name_text text
)
returns public.game_requests
language plpgsql
security definer
set search_path = public
as $$
declare
  created_request public.game_requests;
  caller_is_owner boolean := false;
  cleaned_title text := nullif(trim(game_title_text), '');
  cleaned_platform text := nullif(trim(platform_text), '');
  cleaned_note text := nullif(trim(viewer_note_text), '');
  cleaned_twitch_name text := nullif(trim(twitch_name_text), '');
  test_reference text := 'TEST-' || upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 12));
begin
  select exists (
    select 1
    from public.request_staff
    where user_id = auth.uid()
      and role = 'owner'
      and can_review = true
      and (
        access_source <> 'twitch_moderator'
        or verified_at > now() - interval '65 minutes'
      )
  ) into caller_is_owner;

  if not caller_is_owner then
    raise exception 'Owner access required.';
  end if;

  if request_type_text not in ('catalog', 'unlisted') then
    raise exception 'Choose an owned catalog game or an unlisted game.';
  end if;

  if request_goal_text not in ('play', 'speed_run', 'completion') then
    raise exception 'Choose Play Game, Speed Run Game, or 100%% Completion.';
  end if;

  if cleaned_title is null or char_length(cleaned_title) > 120 then
    raise exception 'Enter a game title between 1 and 120 characters.';
  end if;

  if cleaned_platform is null or char_length(cleaned_platform) > 80 then
    raise exception 'Enter a valid game system.';
  end if;

  if cleaned_note is not null and char_length(cleaned_note) > 300 then
    raise exception 'The optional note cannot exceed 300 characters.';
  end if;

  insert into public.game_requests (
    viewer_id,
    twitch_name,
    request_type,
    request_goal,
    game_title,
    platform,
    viewer_note,
    status,
    is_test,
    payment_reference
  )
  values (
    auth.uid(),
    left(coalesce(cleaned_twitch_name, 'Owner Test'), 25),
    request_type_text::public.game_request_type,
    request_goal_text,
    cleaned_title,
    cleaned_platform,
    cleaned_note,
    'awaiting_payment',
    true,
    test_reference
  )
  returning * into created_request;

  update public.game_requests
  set status = 'approved',
      paid_at = now(),
      payment_provider = 'owner_test',
      payment_currency = 'USD',
      payment_amount = 0,
      payment_deadline = null
  where id = created_request.id
  returning * into created_request;

  return created_request;
exception
  when unique_violation then
    raise exception 'The active request slot is currently occupied. Finish, archive, or clear the current request before creating an owner test.';
end;
$$;

revoke all on function public.owner_submit_test_game_request(text,text,text,text,text,text) from public;
grant execute on function public.owner_submit_test_game_request(text,text,text,text,text,text) to authenticated;

create or replace function public.staff_schedule_game_request(
  request_id uuid,
  scheduled_local timestamp without time zone,
  schedule_explanation text,
  game_summary_text text,
  release_year_value integer
)
returns public.game_requests
language plpgsql
security definer
set search_path = public
as $$
declare
  current_request public.game_requests;
  scheduled_request public.game_requests;
  scheduled_instant timestamptz;
  cleaned_explanation text := nullif(trim(schedule_explanation), '');
  cleaned_summary text := nullif(trim(game_summary_text), '');
begin
  if not public.can_review_game_requests() then
    raise exception 'Verified staff access required.';
  end if;

  select *
  into current_request
  from public.game_requests as game_request
  where game_request.id = request_id
    and game_request.status = 'approved'
    and game_request.paid_at is not null
  for update;

  if current_request.id is null then
    raise exception 'Only paid and approved requests can be scheduled.';
  end if;

  if scheduled_local is not null then
    scheduled_instant := scheduled_local at time zone 'America/New_York';
    if scheduled_instant <= now() then
      raise exception 'The scheduled date and time must be in the future.';
    end if;
    if cleaned_summary is null or char_length(cleaned_summary) < 30 then
      raise exception 'Add a public game summary of at least 30 characters.';
    end if;
    if release_year_value is null or release_year_value not between 1950 and 2100 then
      raise exception 'Add a valid four-digit release year.';
    end if;
  end if;

  if current_request.scheduled_for is not null
     and scheduled_instant is distinct from current_request.scheduled_for
     and cleaned_explanation is null then
    raise exception 'A schedule change explanation is required.';
  end if;

  if scheduled_instant is not distinct from current_request.scheduled_for
     and cleaned_summary is not distinct from current_request.game_summary
     and release_year_value is not distinct from current_request.release_year then
    return current_request;
  end if;

  update public.game_requests as game_request
  set scheduled_for = scheduled_instant,
      game_summary = cleaned_summary,
      release_year = release_year_value,
      schedule_change_reason = case
        when current_request.scheduled_for is not null
          and scheduled_instant is distinct from current_request.scheduled_for
        then left(cleaned_explanation, 500)
        else current_request.schedule_change_reason
      end,
      schedule_changed_at = now(),
      schedule_changed_by = auth.uid()
  where game_request.id = request_id
  returning * into scheduled_request;

  return scheduled_request;
end;
$$;

revoke all on function public.staff_schedule_game_request(uuid,timestamp without time zone,text,text,integer) from public;
grant execute on function public.staff_schedule_game_request(uuid,timestamp without time zone,text,text,integer) to authenticated;

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
      'scheduledFor', game_request.scheduled_for,
      'gameSummary', game_request.game_summary,
      'releaseYear', game_request.release_year
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
  'Returns the public-safe title, platform, request goal, schedule, summary, and release year for the next paid and approved viewer request.';

revoke all on function public.next_public_game_request() from public;
grant execute on function public.next_public_game_request() to anon, authenticated;

commit;
notify pgrst, 'reload schema';
