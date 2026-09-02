create or replace function public.owner_delete_all_archived_game_requests()
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  caller_is_owner boolean := false;
  deleted_count integer := 0;
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

  delete from public.completed_request_vods
  where request_id in (
    select id from public.game_requests where archived_at is not null
  );

  delete from public.discord_notification_logs
  where request_id in (
    select id from public.game_requests where archived_at is not null
  );

  delete from public.game_requests
  where archived_at is not null;

  get diagnostics deleted_count = row_count;

  return jsonb_build_object(
    'success', true,
    'deletedCount', deleted_count,
    'deletedAt', now()
  );
end;
$$;

revoke all on function public.owner_delete_all_archived_game_requests() from public;
grant execute on function public.owner_delete_all_archived_game_requests() to authenticated;
notify pgrst, 'reload schema';
