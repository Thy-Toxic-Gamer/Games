-- Scheduling must never overwrite the game's release year or summary.
-- Keep the legacy signature safe for cached clients; metadata arguments are ignored.
-- The existing three-argument function retains staff/payment/date/reason checks.
begin;
create or replace function public.staff_schedule_game_request(
  request_id uuid,
  scheduled_local timestamp without time zone,
  schedule_explanation text,
  game_summary_text text,
  release_year_value integer
)
returns public.game_requests
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  return public.staff_schedule_game_request(request_id, scheduled_local, schedule_explanation);
end;
$$;
commit;
notify pgrst, 'reload schema';
