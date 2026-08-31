-- ⁅𝐓𝐡𝐲𝐓☣︎𝐱𝐢𝐜𝐆𝐚𝐦𝐞𝐫⁆ staff review dashboard v8.3
-- Run once after the v8.1 global cooldown functions are installed.

create or replace function public.can_review_game_requests()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.request_staff
    where user_id = auth.uid()
      and can_review = true
  );
$$;

drop policy if exists "Review staff can read all requests" on public.game_requests;
create policy "Review staff can read all requests"
on public.game_requests
for select
to authenticated
using (public.can_review_game_requests());

create or replace function public.staff_review_game_request(
  request_id uuid,
  decision text,
  denial_explanation text default null
)
returns public.game_requests
language plpgsql
security definer
set search_path = public
as $$
declare
  reviewed_request public.game_requests;
begin
  if not public.can_review_game_requests() then
    raise exception 'Review staff access required.';
  end if;

  if decision = 'approve' then
    update public.game_requests
    set status = 'awaiting_payment',
        reviewed_at = now(),
        reviewed_by = auth.uid(),
        payment_deadline = now() + interval '48 hours',
        denial_reason = null,
        denied_at = null
    where id = request_id
      and status = 'pending'
    returning * into reviewed_request;
  elsif decision = 'deny' then
    if denial_explanation is null or char_length(trim(denial_explanation)) = 0 then
      raise exception 'A denial explanation is required.';
    end if;

    update public.game_requests
    set status = 'denied',
        denial_reason = left(trim(denial_explanation), 500),
        denied_at = now(),
        reviewed_at = now(),
        reviewed_by = auth.uid(),
        payment_deadline = null
    where id = request_id
      and status = 'pending'
    returning * into reviewed_request;
  else
    raise exception 'Invalid review decision.';
  end if;

  if reviewed_request.id is null then
    raise exception 'This request is no longer pending.';
  end if;

  return reviewed_request;
end;
$$;

revoke all on function public.can_review_game_requests() from public;
revoke all on function public.staff_review_game_request(uuid, text, text) from public;
grant execute on function public.can_review_game_requests() to authenticated;
grant execute on function public.staff_review_game_request(uuid, text, text) to authenticated;

notify pgrst, 'reload schema';
