# Automatic Twitch Moderators and Optional Scheduling

This v10.0 upgrade gives current Twitch moderators automatic Staff Control access and lets staff record an agreed game date after payment.

## What changes

- The owner and existing manually assigned staff keep their current access.
- A Twitch moderator signs in to Staff Control and grants the read-only user:read:moderated_channels Twitch permission.
- The Edge Function validates the Twitch token, matches it to the signed-in Supabase identity, and checks the immutable ThyToxicGamer broadcaster ID.
- Confirmed moderators receive temporary Staff Control access. The page rechecks Twitch every 55 minutes, and automatic access expires after 65 minutes without successful verification.
- Removing someone as a Twitch moderator removes their automatic access at the next verification.
- Paid and approved requests can optionally receive an exact Eastern date and time. Approval and payment do not require scheduling.
- Future scheduled games remain in Recent Requests until 30 days after the game time, then follow the existing Archive retention rules.
- Viewers see the recorded time on their Request Status page.
- Discord receives schedule, reschedule, and schedule-cleared notices through DISCORD_SCHEDULE_WEBHOOK when configured, or the existing approved webhook otherwise.

## One-time database upgrade

Run RUN-THIS-v10.0-AUTO-MODS-SCHEDULING.sql in the Supabase SQL Editor.

The script:

- preserves existing request_staff rows as manual access;
- grants only the protected Supabase service role permission to maintain automatic staff rows;
- adds Twitch verification metadata;
- enforces fresh verification for automatic moderator grants;
- adds nullable scheduling fields to game_requests; and
- installs the secure scheduling database function.

## Find your immutable Twitch broadcaster ID

In the Supabase SQL Editor, run:

    select
      id as supabase_user_id,
      email,
      coalesce(
        raw_user_meta_data ->> 'sub',
        raw_user_meta_data ->> 'provider_id',
        raw_user_meta_data ->> 'user_id'
      ) as twitch_user_id,
      coalesce(
        raw_user_meta_data ->> 'user_name',
        raw_user_meta_data ->> 'preferred_username',
        raw_user_meta_data ->> 'name'
      ) as twitch_name
    from auth.users
    order by created_at;

Find the row for the broadcaster account ThyToxicGamer. Copy only its numeric twitch_user_id.

The Twitch user ID is not an API secret. Do not copy the Supabase user ID into the Edge Function secret.

## Edge Function secrets

In Supabase, add:

- TWITCH_BROADCASTER_ID = the numeric Twitch user ID for ThyToxicGamer
- SITE_ORIGIN = https://thy-toxic-gamer.github.io

Supabase automatically provides SUPABASE_URL, SUPABASE_ANON_KEY, and SUPABASE_SERVICE_ROLE_KEY to deployed Edge Functions. Never put the service-role key, Twitch OAuth token, or Discord webhook URL in GitHub.

## Deploy the functions

Deploy supabase/functions/verify-request-staff/index.ts with JWT verification enabled.

Redeploy supabase/functions/discord-game-requests/index.ts so schedule changes can be announced. The existing approved webhook is used automatically. DISCORD_SCHEDULE_WEBHOOK is optional if schedule notices should go to a separate Discord channel.

## Publish the website

Publish these updated root files:

- review.html
- review-live.js
- status.html
- status-test.js
- request-test.css

After GitHub Pages deploys, use Ctrl + F5.

## First moderator sign-in

Each moderator should:

1. Open Staff Control.
2. Sign out if already signed in.
3. Select **Sign in with Twitch**.
4. Authorize the read-only moderated-channels permission.
5. Confirm the page says **Signed in as Moderator**.

ThyToxicBot should receive access if Twitch currently lists it as a moderator. A non-moderator account receives no Staff Control access.

## Scheduling workflow

1. Staff approves the request for payment.
2. StreamElements confirms payment and the request becomes **Paid & Approved**.
3. The streamer, viewer, and moderators agree on a date outside the approval flow.
4. Staff selects **Schedule Game** on the paid request.
5. Staff enters the agreed Eastern date and time and saves it.
6. Staff can reschedule or clear it later without cancelling the paid request.

The database stores the instant safely as UTC and the website displays it as EST or EDT, depending on daylight-saving time.

## Verification checklist

- Owner access still works.
- A current moderator can open Staff Control after fresh Twitch authorization.
- A non-moderator cannot open Staff Control.
- A paid request can be scheduled, rescheduled, and cleared.
- A pending or awaiting-payment request cannot be scheduled.
- The viewer status page shows the same Eastern time.
- Discord does not resend the payment-approved notice when only the schedule changes.
