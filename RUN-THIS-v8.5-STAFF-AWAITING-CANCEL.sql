-- ⁅𝐓𝐡𝐲𝐓☣︎𝐱𝐢𝐜𝐆𝐚𝐦𝐞𝐫⁆ staff awaiting-request cancellation v8.5
-- Run once after the v8.3 review dashboard upgrade.

alter table public.game_requests
  add column if not exists cancellation_reason text;

create or replace function public.staff_cancel_awaiting_request(
  request_id uuid,
  cancellation_explanation text
)
returns public.game_requests
language plpgsql
security definer
set search_path = public
as $$
declare
  cancelled_request public.game_requests;
begin
  if not public.can_review_game_requests() then
    raise exception 'Review staff access required.';
  end if;

  if cancellation_explanation is null
     or char_length(trim(cancellation_explanation)) = 0 then
    raise exception 'A cancellation explanation is required.';
  end if;

  update public.game_requests
  set status = 'cancelled',
      cancellation_reason = left(trim(cancellation_explanation), 500),
      cancelled_at = now(),
      reviewed_at = now(),
      reviewed_by = auth.uid(),
      payment_deadline = null
  where id = request_id
    and status = 'awaiting_payment'
  returning * into cancelled_request;

  if cancelled_request.id is null then
    raise exception 'This request is no longer awaiting payment.';
  end if;

  return cancelled_request;
end;
$$;

revoke all
on function public.staff_cancel_awaiting_request(uuid, text)
from public;

grant execute
on function public.staff_cancel_awaiting_request(uuid, text)
to authenticated;

notify pgrst, 'reload schema';
