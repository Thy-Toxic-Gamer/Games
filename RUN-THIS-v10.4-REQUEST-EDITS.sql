-- ⁅𝐓𝐡𝐲𝐓☣︎𝐱𝐢𝐜𝐆𝐚𝐦𝐞𝐫⁆ secure staff request editing v10.4
-- Run once after RUN-THIS-v10.3-REQUEST-CHOICES.sql.
-- Safe to run again if the first run is interrupted.

begin;

alter table public.game_requests
  add column if not exists previous_game_title text,
  add column if not exists previous_platform text,
  add column if not exists request_change_reason text,
  add column if not exists request_changed_at timestamptz,
  add column if not exists request_changed_by uuid references auth.users(id) on delete set null;

alter table public.game_requests
  drop constraint if exists game_requests_request_change_reason_length;

alter table public.game_requests
  add constraint game_requests_request_change_reason_length
  check (
    request_change_reason is null
    or char_length(request_change_reason) between 10 and 500
  );

create table if not exists public.game_request_changes (
  id bigint generated always as identity primary key,
  request_id uuid not null references public.game_requests(id) on delete cascade,
  changed_by uuid references auth.users(id) on delete set null,
  old_game_title text not null,
  new_game_title text not null,
  old_platform text,
  new_platform text,
  change_reason text not null check (char_length(change_reason) between 10 and 500),
  request_type text not null,
  request_goal text not null,
  price_at_change integer not null,
  changed_at timestamptz not null default now()
);

create index if not exists game_request_changes_request_changed_idx
  on public.game_request_changes (request_id, changed_at desc);

alter table public.game_request_changes enable row level security;

drop policy if exists "Review staff can read request changes" on public.game_request_changes;
create policy "Review staff can read request changes"
on public.game_request_changes
for select
to authenticated
using (public.can_review_game_requests());

revoke all on table public.game_request_changes from public;
grant select on table public.game_request_changes to authenticated;

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

  if current_request.scheduled_for is not null
     and current_request.scheduled_for <= now() then
    raise exception 'This request cannot be edited after its scheduled stream has begun.';
  end if;

  if cleaned_title = current_request.game_title
     and cleaned_platform = coalesce(current_request.platform, '') then
    raise exception 'Change the game title or platform before saving.';
  end if;

  update public.game_requests as game_request
  set previous_game_title = current_request.game_title,
      previous_platform = current_request.platform,
      game_title = cleaned_title,
      platform = cleaned_platform,
      request_change_reason = cleaned_explanation,
      request_changed_at = now(),
      request_changed_by = auth.uid()
  where game_request.id = request_id
  returning * into updated_request;

  insert into public.game_request_changes (
    request_id,
    changed_by,
    old_game_title,
    new_game_title,
    old_platform,
    new_platform,
    change_reason,
    request_type,
    request_goal,
    price_at_change,
    changed_at
  ) values (
    current_request.id,
    auth.uid(),
    current_request.game_title,
    updated_request.game_title,
    current_request.platform,
    updated_request.platform,
    cleaned_explanation,
    current_request.request_type::text,
    current_request.request_goal,
    current_request.minimum_amount,
    updated_request.request_changed_at
  );

  return updated_request;
end;
$$;

revoke all on function public.staff_edit_game_request(uuid, text, text, text) from public;
grant execute on function public.staff_edit_game_request(uuid, text, text, text) to authenticated;

commit;

notify pgrst, 'reload schema';

