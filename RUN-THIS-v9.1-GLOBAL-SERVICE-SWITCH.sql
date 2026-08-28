-- ThyToxicGamer global game-request service switch v9.1
-- Run once in the Supabase SQL editor after the v9.0 upgrade.

alter table public.request_system_settings
  add column if not exists service_enabled boolean not null default true,
  add column if not exists service_changed_at timestamptz,
  add column if not exists service_changed_by uuid references auth.users(id) on delete set null;

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

-- The emergency service switch blocks every new request, including staff cooldown bypasses.
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

  return jsonb_build_object(
    'success', true,
    'serviceEnabled', enabled,
    'changedAt', now()
  );
end;
$$;

revoke all on function public.request_service_enabled() from public;
revoke all on function public.set_request_service_enabled(boolean) from public;
revoke all on function public.request_system_state() from public;
grant execute on function public.request_system_state() to anon, authenticated;
grant execute on function public.request_service_enabled() to authenticated;
grant execute on function public.set_request_service_enabled(boolean) to authenticated;

notify pgrst, 'reload schema';
