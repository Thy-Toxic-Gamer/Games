-- ⁅𝐓𝐡𝐲𝐓☣︎𝐱𝐢𝐜𝐆𝐚𝐦𝐞𝐫⁆ automatic Twitch moderator access and optional scheduling v10.0
-- Run once after the existing v9.3 database upgrades.

alter table public.request_staff
  add column if not exists access_source text not null default 'manual',
  add column if not exists twitch_user_id text,
  add column if not exists twitch_login text,
  add column if not exists verified_at timestamptz;

update public.request_staff
set access_source = 'manual'
where access_source is null;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'request_staff_access_source_check'
      and conrelid = 'public.request_staff'::regclass
  ) then
    alter table public.request_staff
      add constraint request_staff_access_source_check
      check (access_source in ('manual', 'twitch_moderator', 'twitch_owner'));
  end if;
end;
$$;

create unique index if not exists request_staff_user_id_unique
  on public.request_staff (user_id);

create index if not exists request_staff_twitch_user_id_idx
  on public.request_staff (twitch_user_id);

-- The verification Edge Function uses the protected service role to maintain
-- automatic grants. No browser or authenticated viewer receives table access.
grant select, insert, update, delete
  on table public.request_staff
  to service_role;

-- Automatic moderator grants must have been confirmed by Twitch within the
-- last 65 minutes. The Staff Control page re-verifies on load and hourly.
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
      and (
        access_source <> 'twitch_moderator'
        or verified_at > now() - interval '65 minutes'
      )
  );
$$;

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
      'canResetCooldown', true,
      'accessSource', access_source,
      'verifiedAt', verified_at,
      'verificationExpiresAt',
        case
          when access_source = 'twitch_moderator'
          then verified_at + interval '65 minutes'
          else null
        end
    )
    from public.request_staff
    where user_id = auth.uid()
      and (
        access_source <> 'twitch_moderator'
        or verified_at > now() - interval '65 minutes'
      )
  ), jsonb_build_object(
    'isStaff', false,
    'role', null,
    'canReview', false,
    'canResetCooldown', false,
    'accessSource', null,
    'verifiedAt', null,
    'verificationExpiresAt', null
  ));
$$;

-- Apply the same verified staff rule to the emergency service controls.
create or replace function public.set_request_service_enabled(enabled boolean)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.can_review_game_requests() then
    raise exception 'Verified staff access required.';
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

  return jsonb_build_object(
    'success', true,
    'serviceEnabled', enabled,
    'changedAt', now()
  );
end;
$$;

create or replace function public.reset_global_request_cooldown()
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.can_review_game_requests() then
    raise exception 'Verified staff access required.';
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

alter table public.game_requests
  add column if not exists scheduled_for timestamptz,
  add column if not exists schedule_changed_at timestamptz,
  add column if not exists schedule_changed_by uuid
    references auth.users(id) on delete set null;

create index if not exists game_requests_scheduled_for_idx
  on public.game_requests (scheduled_for)
  where scheduled_for is not null;

-- Keep future scheduled games in Recent Requests. Once the game time passes,
-- normal retention archives it 30 days later and deletes it six months later.
create or replace function public.maintain_request_archive()
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  archived_count integer := 0;
  deleted_count integer := 0;
begin
  update public.game_requests
  set archived_at = now()
  where archived_at is null
    and status in ('approved', 'denied', 'expired', 'cancelled')
    and greatest(
      coalesce(approved_at, denied_at, reviewed_at, created_at),
      coalesce(scheduled_for, '-infinity'::timestamptz)
    ) < now() - interval '30 days';

  get diagnostics archived_count = row_count;

  delete from public.game_requests
  where archived_at is not null
    and archived_at < now() - interval '6 months'
    and status in ('approved', 'denied', 'expired', 'cancelled');

  get diagnostics deleted_count = row_count;

  return jsonb_build_object(
    'archived', archived_count,
    'deleted', deleted_count,
    'completedAt', now()
  );
end;
$$;

-- Scheduling is optional and only becomes available after payment is confirmed.
-- The browser sends an Eastern wall-clock value; PostgreSQL converts it to UTC.
create or replace function public.staff_schedule_game_request(
  request_id uuid,
  scheduled_local timestamp without time zone
)
returns public.game_requests
language plpgsql
security definer
set search_path = public
as $$
declare
  scheduled_request public.game_requests;
  scheduled_instant timestamptz;
begin
  if not public.can_review_game_requests() then
    raise exception 'Verified staff access required.';
  end if;

  if scheduled_local is not null then
    scheduled_instant := scheduled_local at time zone 'America/New_York';
    if scheduled_instant <= now() then
      raise exception 'The scheduled date and time must be in the future.';
    end if;
  end if;

  update public.game_requests as game_request
  set scheduled_for = scheduled_instant,
      schedule_changed_at = now(),
      schedule_changed_by = auth.uid()
  where game_request.id = request_id
    and game_request.status = 'approved'
    and game_request.paid_at is not null
  returning * into scheduled_request;

  if scheduled_request.id is null then
    raise exception 'Only paid and approved requests can be scheduled.';
  end if;

  return scheduled_request;
end;
$$;

revoke all on function public.can_review_game_requests() from public;
revoke all on function public.my_request_staff_access() from public;
revoke all on function public.set_request_service_enabled(boolean) from public;
revoke all on function public.reset_global_request_cooldown() from public;
revoke all on function public.staff_schedule_game_request(uuid, timestamp without time zone) from public;

grant execute on function public.can_review_game_requests() to authenticated;
grant execute on function public.my_request_staff_access() to authenticated;
grant execute on function public.set_request_service_enabled(boolean) to authenticated;
grant execute on function public.reset_global_request_cooldown() to authenticated;
grant execute on function public.staff_schedule_game_request(uuid, timestamp without time zone) to authenticated;

notify pgrst, 'reload schema';
