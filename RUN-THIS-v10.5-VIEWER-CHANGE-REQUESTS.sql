-- ThyToxicGamer viewer-requested game changes v10.5
-- Run once after RUN-THIS-v10.4-REQUEST-EDITS.sql.
-- Safe to run again if the first run is interrupted.

begin;

alter table public.game_requests
  add column if not exists viewer_change_status text,
  add column if not exists viewer_change_game_title text,
  add column if not exists viewer_change_platform text,
  add column if not exists viewer_change_reason text,
  add column if not exists viewer_change_requested_at timestamptz,
  add column if not exists viewer_change_reviewed_at timestamptz,
  add column if not exists viewer_change_reviewed_by uuid references auth.users(id) on delete set null,
  add column if not exists viewer_change_decision_reason text;

alter table public.game_requests
  drop constraint if exists game_requests_viewer_change_status_valid,
  drop constraint if exists game_requests_viewer_change_title_length,
  drop constraint if exists game_requests_viewer_change_platform_length,
  drop constraint if exists game_requests_viewer_change_reason_length,
  drop constraint if exists game_requests_viewer_change_decision_length;

alter table public.game_requests
  add constraint game_requests_viewer_change_status_valid
    check (viewer_change_status is null or viewer_change_status in ('pending', 'approved', 'denied')),
  add constraint game_requests_viewer_change_title_length
    check (viewer_change_game_title is null or char_length(viewer_change_game_title) between 1 and 160),
  add constraint game_requests_viewer_change_platform_length
    check (viewer_change_platform is null or char_length(viewer_change_platform) between 1 and 80),
  add constraint game_requests_viewer_change_reason_length
    check (viewer_change_reason is null or char_length(viewer_change_reason) between 10 and 500),
  add constraint game_requests_viewer_change_decision_length
    check (viewer_change_decision_reason is null or char_length(viewer_change_decision_reason) between 10 and 500);

create index if not exists game_requests_pending_viewer_change_idx
  on public.game_requests (viewer_change_requested_at desc)
  where viewer_change_status = 'pending';

create or replace function public.request_my_game_change(
  request_id uuid,
  requested_title text,
  requested_platform text,
  change_explanation text
)
returns public.game_requests
language plpgsql
security definer
set search_path = public
as $$
declare
  current_request public.game_requests;
  updated_request public.game_requests;
  cleaned_title text;
  cleaned_platform text;
  cleaned_explanation text;
begin
  if auth.uid() is null then
    raise exception 'Sign in with Twitch before requesting a change.';
  end if;

  cleaned_title := trim(coalesce(requested_title, ''));
  cleaned_platform := trim(coalesce(requested_platform, ''));
  cleaned_explanation := trim(coalesce(change_explanation, ''));

  if char_length(cleaned_title) not between 1 and 160 then
    raise exception 'Enter a game title between 1 and 160 characters.';
  end if;

  if char_length(cleaned_platform) not between 1 and 80 then
    raise exception 'Enter a console or system between 1 and 80 characters.';
  end if;

  if char_length(cleaned_explanation) not between 10 and 500 then
    raise exception 'Explain the requested change in 10 to 500 characters.';
  end if;

  select *
  into current_request
  from public.game_requests as game_request
  where game_request.id = request_id
    and game_request.viewer_id = auth.uid()
  for update;

  if current_request.id is null then
    raise exception 'Request not found.';
  end if;

  if current_request.status::text not in ('pending', 'awaiting_payment', 'approved') then
    raise exception 'This request can no longer be changed.';
  end if;

  if current_request.scheduled_for is not null and current_request.scheduled_for <= now() then
    raise exception 'A change cannot be requested after the scheduled stream has begun.';
  end if;

  if current_request.viewer_change_status = 'pending' then
    raise exception 'A game change request is already waiting for staff review.';
  end if;

  if lower(cleaned_title) = lower(current_request.game_title)
     and lower(cleaned_platform) = lower(coalesce(current_request.platform, '')) then
    raise exception 'Choose a different game title or console before submitting.';
  end if;

  update public.game_requests as game_request
  set viewer_change_status = 'pending',
      viewer_change_game_title = cleaned_title,
      viewer_change_platform = cleaned_platform,
      viewer_change_reason = cleaned_explanation,
      viewer_change_requested_at = now(),
      viewer_change_reviewed_at = null,
      viewer_change_reviewed_by = null,
      viewer_change_decision_reason = null
  where game_request.id = request_id
  returning * into updated_request;

  return updated_request;
end;
$$;

revoke all on function public.request_my_game_change(uuid, text, text, text) from public;
grant execute on function public.request_my_game_change(uuid, text, text, text) to authenticated;

create or replace function public.staff_deny_game_change_request(
  request_id uuid,
  denial_explanation text
)
returns public.game_requests
language plpgsql
security definer
set search_path = public
as $$
declare
  current_request public.game_requests;
  updated_request public.game_requests;
  cleaned_explanation text;
begin
  if not public.can_review_game_requests() then
    raise exception 'Verified staff access required.';
  end if;

  cleaned_explanation := trim(coalesce(denial_explanation, ''));
  if char_length(cleaned_explanation) not between 10 and 500 then
    raise exception 'Enter a denial explanation between 10 and 500 characters.';
  end if;

  select *
  into current_request
  from public.game_requests as game_request
  where game_request.id = request_id
  for update;

  if current_request.id is null then
    raise exception 'Request not found.';
  end if;

  if current_request.viewer_change_status is distinct from 'pending' then
    raise exception 'There is no pending viewer change request to deny.';
  end if;

  update public.game_requests as game_request
  set viewer_change_status = 'denied',
      viewer_change_reviewed_at = now(),
      viewer_change_reviewed_by = auth.uid(),
      viewer_change_decision_reason = cleaned_explanation
  where game_request.id = request_id
  returning * into updated_request;

  return updated_request;
end;
$$;

revoke all on function public.staff_deny_game_change_request(uuid, text) from public;
grant execute on function public.staff_deny_game_change_request(uuid, text) to authenticated;

create or replace function public.staff_edit_game_request(
  request_id uuid,
  new_game_title text,
  new_platform text,
  change_explanation text
)
returns public.game_requests
language plpgsql
security definer
set search_path = public
as $$
declare
  current_request public.game_requests;
  updated_request public.game_requests;
  cleaned_title text;
  cleaned_platform text;
  cleaned_explanation text;
  approves_viewer_change boolean;
begin
  if not public.can_review_game_requests() then
    raise exception 'Verified staff access required.';
  end if;

  cleaned_title := trim(coalesce(new_game_title, ''));
  cleaned_platform := trim(coalesce(new_platform, ''));
  cleaned_explanation := trim(coalesce(change_explanation, ''));

  if char_length(cleaned_title) not between 1 and 160 then
    raise exception 'Enter a game title between 1 and 160 characters.';
  end if;
  if char_length(cleaned_platform) not between 1 and 80 then
    raise exception 'Enter a platform or system between 1 and 80 characters.';
  end if;
  if char_length(cleaned_explanation) not between 10 and 500 then
    raise exception 'Enter a change explanation between 10 and 500 characters.';
  end if;

  select *
  into current_request
  from public.game_requests as game_request
  where game_request.id = request_id
  for update;

  if current_request.id is null then
    raise exception 'Request not found.';
  end if;
  if current_request.status::text not in ('pending', 'awaiting_payment', 'approved') then
    raise exception 'Only pending, awaiting-payment, or approved requests can be edited.';
  end if;
  if current_request.scheduled_for is not null and current_request.scheduled_for <= now() then
    raise exception 'This request cannot be edited after its scheduled stream has begun.';
  end if;
  if cleaned_title = current_request.game_title
     and cleaned_platform = coalesce(current_request.platform, '') then
    raise exception 'Change the game title or platform before saving.';
  end if;

  approves_viewer_change := current_request.viewer_change_status = 'pending'
    and lower(cleaned_title) = lower(coalesce(current_request.viewer_change_game_title, ''))
    and lower(cleaned_platform) = lower(coalesce(current_request.viewer_change_platform, ''));

  update public.game_requests as game_request
  set previous_game_title = current_request.game_title,
      previous_platform = current_request.platform,
      game_title = cleaned_title,
      platform = cleaned_platform,
      request_change_reason = cleaned_explanation,
      request_changed_at = now(),
      request_changed_by = auth.uid(),
      viewer_change_status = case when approves_viewer_change then 'approved' else game_request.viewer_change_status end,
      viewer_change_reviewed_at = case when approves_viewer_change then now() else game_request.viewer_change_reviewed_at end,
      viewer_change_reviewed_by = case when approves_viewer_change then auth.uid() else game_request.viewer_change_reviewed_by end,
      viewer_change_decision_reason = case when approves_viewer_change then cleaned_explanation else game_request.viewer_change_decision_reason end
  where game_request.id = request_id
  returning * into updated_request;

  insert into public.game_request_changes (
    request_id, changed_by, old_game_title, new_game_title, old_platform,
    new_platform, change_reason, request_type, request_goal, price_at_change, changed_at
  ) values (
    current_request.id, auth.uid(), current_request.game_title, updated_request.game_title,
    current_request.platform, updated_request.platform, cleaned_explanation,
    current_request.request_type::text, current_request.request_goal,
    current_request.minimum_amount, updated_request.request_changed_at
  );

  return updated_request;
end;
$$;

revoke all on function public.staff_edit_game_request(uuid, text, text, text) from public;
grant execute on function public.staff_edit_game_request(uuid, text, text, text) to authenticated;

commit;

notify pgrst, 'reload schema';
