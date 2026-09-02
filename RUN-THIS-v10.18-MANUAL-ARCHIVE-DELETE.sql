-- Manual Request Records controls: staff archive + owner-only permanent delete

alter table public.game_requests
  add column if not exists archived_by uuid
    references auth.users(id) on delete set null;

create or replace function public.staff_archive_game_request(target_request_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  archived_request public.game_requests;
begin
  if not public.can_review_game_requests() then
    raise exception 'Verified staff access required.';
  end if;

  if target_request_id is null then
    raise exception 'A request ID is required.';
  end if;

  update public.game_requests as game_request
  set archived_at = now(),
      archived_by = auth.uid()
  where game_request.id = target_request_id
    and game_request.archived_at is null
    and (
      game_request.completed_at is not null
      or game_request.status in ('denied', 'expired', 'cancelled')
    )
  returning * into archived_request;

  if archived_request.id is null then
    raise exception 'Only completed, denied, expired, or cancelled requests can be archived.';
  end if;

  return jsonb_build_object(
    'success', true,
    'requestId', archived_request.id,
    'archivedAt', archived_request.archived_at
  );
end;
$$;

create or replace function public.owner_delete_game_request(target_request_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  deleted_request public.game_requests;
  caller_is_owner boolean := false;
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

  if target_request_id is null then
    raise exception 'A request ID is required.';
  end if;

  select * into deleted_request
  from public.game_requests
  where id = target_request_id
    and (
      completed_at is not null
      or status in ('denied', 'expired', 'cancelled')
    );

  if deleted_request.id is null then
    raise exception 'Only completed, denied, expired, or cancelled requests can be permanently deleted.';
  end if;

  delete from public.completed_request_vods where request_id = target_request_id;
  delete from public.discord_notification_logs where request_id = target_request_id;
  delete from public.game_requests where id = target_request_id;

  return jsonb_build_object(
    'success', true,
    'requestId', deleted_request.id,
    'gameTitle', deleted_request.game_title,
    'deletedAt', now()
  );
end;
$$;

revoke all on function public.staff_archive_game_request(uuid) from public;
revoke all on function public.owner_delete_game_request(uuid) from public;

grant execute on function public.staff_archive_game_request(uuid) to authenticated;
grant execute on function public.owner_delete_game_request(uuid) to authenticated;

notify pgrst, 'reload schema';
