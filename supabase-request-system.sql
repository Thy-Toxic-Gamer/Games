-- ⁅𝐓𝐡𝐲𝐓☣︎𝐱𝐢𝐜𝐆𝐚𝐦𝐞𝐫⁆ live request system v8.1
-- Safe to run whether or not the earlier v8.0 helper script was run.

create table if not exists public.request_system_settings (
  singleton boolean primary key default true check (singleton = true),
  service_enabled boolean not null default true,
  service_changed_at timestamptz,
  service_changed_by uuid references auth.users(id) on delete set null,
  global_cooldown_ends timestamptz,
  cooldown_started_at timestamptz,
  cooldown_request_id uuid references public.game_requests(id) on delete set null,
  reset_at timestamptz,
  reset_by uuid references auth.users(id) on delete set null
);

alter table public.request_system_settings
  add column if not exists service_enabled boolean not null default true,
  add column if not exists service_changed_at timestamptz,
  add column if not exists service_changed_by uuid references auth.users(id) on delete set null;

insert into public.request_system_settings (singleton)
values (true)
on conflict (singleton) do nothing;

alter table public.request_system_settings enable row level security;

create or replace function public.request_service_enabled()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce((
    select service_enabled
    from public.request_system_settings
    where singleton = true
  ), true);
$$;

create or replace function public.global_request_cooldown_active()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce((
    select global_cooldown_ends > now()
    from public.request_system_settings
    where singleton = true
  ), false);
$$;

-- Replace the original per-viewer submission policy with the global cooldown.
drop policy if exists "Viewers can create valid requests" on public.game_requests;
create policy "Viewers can create valid requests"
on public.game_requests
for insert
to authenticated
with check (
  viewer_id = auth.uid()
  and status = 'pending'
  and public.request_service_enabled()
  and (
    public.can_bypass_request_cooldown()
    or not public.global_request_cooldown_active()
  )
);

-- Starting an approved request automatically starts the global 14-day cooldown.
create or replace function public.activate_global_request_cooldown()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  cooldown_deadline timestamptz;
begin
  if new.status = 'approved' and old.status is distinct from 'approved' then
    cooldown_deadline := coalesce(new.cooldown_ends, now() + interval '14 days');
    new.approved_at := coalesce(new.approved_at, now());
    new.cooldown_ends := cooldown_deadline;

    insert into public.request_system_settings (
      singleton, global_cooldown_ends, cooldown_started_at,
      cooldown_request_id, reset_at, reset_by
    ) values (
      true, cooldown_deadline, now(), new.id, null, null
    )
    on conflict (singleton) do update set
      global_cooldown_ends = excluded.global_cooldown_ends,
      cooldown_started_at = excluded.cooldown_started_at,
      cooldown_request_id = excluded.cooldown_request_id,
      reset_at = null,
      reset_by = null;
  end if;
  return new;
end;
$$;

drop trigger if exists game_request_global_cooldown on public.game_requests;
create trigger game_request_global_cooldown
before update of status on public.game_requests
for each row
execute function public.activate_global_request_cooldown();

-- Public pages receive only safe slot and cooldown information.
create or replace function public.request_system_state()
returns jsonb
language sql
stable
security definer
set search_path = public
as $$
  select jsonb_build_object(
    'serviceEnabled', public.request_service_enabled(),
    'slotOpen', not exists (
      select 1 from public.game_requests
      where status in ('pending', 'awaiting_payment')
    ),
    'globalCooldownEnds', (
      select global_cooldown_ends
      from public.request_system_settings
      where singleton = true
        and global_cooldown_ends > now()
    ),
    'canBypassCooldown', public.can_bypass_request_cooldown()
  );
$$;

-- This is the function used by the private website service switch.
create or replace function public.set_request_service_enabled(enabled boolean)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
begin
  if not exists (
    select 1 from public.request_staff where user_id = auth.uid()
  ) then
    raise exception 'Staff access required.';
  end if;

  if enabled is null then
    raise exception 'A service state is required.';
  end if;

  insert into public.request_system_settings (
    singleton, service_enabled, service_changed_at, service_changed_by
  ) values (
    true, enabled, now(), auth.uid()
  )
  on conflict (singleton) do update set
    service_enabled = excluded.service_enabled,
    service_changed_at = excluded.service_changed_at,
    service_changed_by = excluded.service_changed_by;

  return jsonb_build_object('success', true, 'serviceEnabled', enabled, 'changedAt', now());
end;
$$;

-- Staff can confirm their access without reading the staff table directly.
create or replace function public.my_request_staff_access()
returns jsonb
language sql
stable
security definer
set search_path = public
as $$
  select coalesce((
    select jsonb_build_object(
      'isStaff', true,
      'role', role,
      'canReview', can_review,
      'canResetCooldown', true
    )
    from public.request_staff
    where user_id = auth.uid()
  ), jsonb_build_object(
    'isStaff', false,
    'role', null,
    'canReview', false,
    'canResetCooldown', false
  ));
$$;

-- This is the function used by the private website reset button.
create or replace function public.reset_global_request_cooldown()
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
begin
  if not exists (
    select 1 from public.request_staff where user_id = auth.uid()
  ) then
    raise exception 'Staff access required.';
  end if;

  update public.request_system_settings
  set global_cooldown_ends = null,
      reset_at = now(),
      reset_by = auth.uid()
  where singleton = true;

  update public.game_requests
  set cooldown_ends = now()
  where status = 'approved'
    and cooldown_ends > now();

  return jsonb_build_object('success', true, 'resetAt', now());
end;
$$;

create or replace function public.schedule_global_request_cooldown(
  cooldown_ends_local text
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  cooldown_deadline timestamptz;
begin
  if not exists (
    select 1
    from public.request_staff
    where user_id = auth.uid()
      and role = 'owner'
      and can_review = true
  ) then
    raise exception 'Owner access required.';
  end if;

  if cooldown_ends_local is null or char_length(trim(cooldown_ends_local)) = 0 then
    raise exception 'Choose when the cooldown should end.';
  end if;

  begin
    cooldown_deadline := cooldown_ends_local::timestamp at time zone 'America/New_York';
  exception when others then
    raise exception 'The cooldown end date and time is invalid.';
  end;

  if cooldown_deadline <= now() + interval '1 minute' then
    raise exception 'Choose a cooldown end time at least one minute in the future.';
  end if;

  insert into public.request_system_settings (
    singleton, global_cooldown_ends, cooldown_started_at,
    cooldown_request_id, reset_at, reset_by
  ) values (
    true, cooldown_deadline, now(), null, null, null
  )
  on conflict (singleton) do update set
    global_cooldown_ends = excluded.global_cooldown_ends,
    cooldown_started_at = excluded.cooldown_started_at,
    cooldown_request_id = null,
    reset_at = null,
    reset_by = null;

  return jsonb_build_object(
    'success', true,
    'cooldownEnds', cooldown_deadline,
    'startedAt', now()
  );
end;
$$;

revoke all on function public.request_system_state() from public;
revoke all on function public.my_request_staff_access() from public;
revoke all on function public.reset_global_request_cooldown() from public;
revoke all on function public.schedule_global_request_cooldown(text) from public;
revoke all on function public.request_service_enabled() from public;
revoke all on function public.set_request_service_enabled(boolean) from public;
grant execute on function public.request_system_state() to anon, authenticated;
grant execute on function public.my_request_staff_access() to authenticated;
grant execute on function public.reset_global_request_cooldown() to authenticated;
grant execute on function public.schedule_global_request_cooldown(text) to authenticated;
grant execute on function public.request_service_enabled() to authenticated;
grant execute on function public.set_request_service_enabled(boolean) to authenticated;
