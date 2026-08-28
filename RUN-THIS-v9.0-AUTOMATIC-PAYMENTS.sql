-- ThyToxicGamer automatic StreamElements payment system v9.0
-- Run once in the Supabase SQL editor after the v8.6 upgrades.

alter table public.game_requests
  add column if not exists payment_reference text,
  add column if not exists streamelements_tip_id text,
  add column if not exists payment_provider text,
  add column if not exists payment_currency text,
  add column if not exists payment_amount numeric(10,2),
  add column if not exists paid_at timestamptz;

create unique index if not exists game_requests_payment_reference_key
  on public.game_requests (payment_reference)
  where payment_reference is not null;

create unique index if not exists game_requests_streamelements_tip_id_key
  on public.game_requests (streamelements_tip_id)
  where streamelements_tip_id is not null;

create or replace function public.assign_game_request_payment_reference()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  if new.status = 'awaiting_payment' and old.status is distinct from 'awaiting_payment' then
    new.payment_reference := coalesce(
      new.payment_reference,
      'TG-' || upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 10))
    );
    new.payment_deadline := coalesce(new.payment_deadline, now() + interval '48 hours');
  end if;
  return new;
end;
$$;

drop trigger if exists game_request_payment_reference on public.game_requests;
create trigger game_request_payment_reference
before update of status on public.game_requests
for each row
execute function public.assign_game_request_payment_reference();

update public.game_requests
set payment_reference = 'TG-' || upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 10))
where status = 'awaiting_payment'
  and payment_reference is null;


-- The Edge Function service role may read and confirm payments.
grant select, update
on table public.game_requests
to service_role;
