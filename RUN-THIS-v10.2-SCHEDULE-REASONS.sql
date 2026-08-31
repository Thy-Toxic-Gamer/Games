-- ⁅𝐓𝐡𝐲𝐓☣︎𝐱𝐢𝐜𝐆𝐚𝐦𝐞𝐫⁆ required schedule-change explanations v10.2
-- Run once after RUN-THIS-v10.0-AUTO-MODS-SCHEDULING.sql.

alter table public.game_requests
  add column if not exists schedule_change_reason text;

alter table public.game_requests
  drop constraint if exists game_requests_schedule_change_reason_length;

alter table public.game_requests
  add constraint game_requests_schedule_change_reason_length
  check (
    schedule_change_reason is null
    or char_length(schedule_change_reason) between 1 and 500
  );

-- Remove the earlier two-argument overload so schedule changes cannot bypass
-- the required explanation through an old RPC signature.
drop function if exists public.staff_schedule_game_request(
  uuid,
  timestamp without time zone
);

create or replace function public.staff_schedule_game_request(
  request_id uuid,
  scheduled_local timestamp without time zone,
  schedule_explanation text default null
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
  cleaned_explanation text;
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
  end if;

  -- Saving the exact same value is a no-op and does not require a reason.
  if scheduled_instant is not distinct from current_request.scheduled_for then
    return current_request;
  end if;

  cleaned_explanation := nullif(trim(schedule_explanation), '');

  if current_request.scheduled_for is not null
     and cleaned_explanation is null then
    raise exception 'A schedule change explanation is required.';
  end if;

  update public.game_requests as game_request
  set scheduled_for = scheduled_instant,
      schedule_change_reason = case
        when current_request.scheduled_for is not null
        then left(cleaned_explanation, 500)
        else null
      end,
      schedule_changed_at = now(),
      schedule_changed_by = auth.uid()
  where game_request.id = request_id
  returning * into scheduled_request;

  return scheduled_request;
end;
$$;

revoke all on function public.staff_schedule_game_request(
  uuid,
  timestamp without time zone,
  text
) from public;

grant execute on function public.staff_schedule_game_request(
  uuid,
  timestamp without time zone,
  text
) to authenticated;

notify pgrst, 'reload schema';

