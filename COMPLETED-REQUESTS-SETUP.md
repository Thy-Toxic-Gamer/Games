# Completed Requested Streams Setup

This upgrade adds the final request step: staff records a completed requested stream, Discord announces it, and the public catalog links viewers to the VOD from the beginning.

## 1. Create the Discord channel

1. Create a Discord text channel named `#completed-requests`.
2. Open the channel settings, then **Integrations → Webhooks → New Webhook**.
3. Name it `ThyToxicBot Completed Requests` and copy its webhook URL.
4. Never paste the webhook URL into GitHub, website JavaScript, screenshots, or chat.

## 2. Install the database upgrade

In the Supabase SQL Editor, run the complete `RUN-THIS-v10.9-COMPLETED-REQUESTS.sql` file.

The script:

- adds the private completion fields to `game_requests`;
- creates a separate privacy-safe public VOD record;
- allows verified staff to mark only paid and approved requests complete;
- requires a valid YouTube VOD link and accepts an optional Twitch VOD link;
- removes Twitch links from public results 60 days after completion;
- keeps permanent YouTube entries after the private request record is deleted; and
- prevents completed streams from appearing as the next scheduled request.

## 3. Add the Discord secret

In **Supabase → Edge Functions → Secrets**, add:

`DISCORD_COMPLETED_WEBHOOK` = the private webhook URL for `#completed-requests`

Keep every existing Edge Function secret unchanged.

## 4. Redeploy the Edge Functions

Redeploy:

- `supabase/functions/discord-game-requests/index.ts` as `discord-game-requests`
- `supabase/functions/discord-notification-health/index.ts` as `discord-notification-health`

Keep their current JWT and database-webhook settings unchanged.

## 5. Complete a request

1. Open **Staff Control → Request Records**.
2. Find the paid and approved requested stream.
3. Select **Mark Request Complete**.
4. Confirm the Eastern completion date and time.
5. Paste the permanent YouTube VOD URL.
6. Optionally paste the Twitch VOD URL.
7. Select **Publish Completed Stream**.

The website publishes only:

- `Requested Stream`
- game title
- console or system
- Play Game, Speed Run Game, or 100% Completion
- completed date
- Watch on YouTube
- Watch on Twitch, while the link is inside its 60-day window

Viewer names, request IDs, payment details, notes, staff identities, and Discord webhook information remain private.

## Verification checklist

- Staff cannot complete an unpaid request.
- YouTube is required and opens the VOD from the beginning.
- Twitch is optional and opens the VOD from the beginning.
- `#completed-requests` receives the completed-stream embed and both available links.
- The Completed Requests website tab shows the same safe details.
- The viewer Request Status page shows the completed state and VOD links.
- Twitch disappears automatically after 60 days while YouTube remains.
