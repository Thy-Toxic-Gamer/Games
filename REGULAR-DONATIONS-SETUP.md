# Regular StreamElements Donations to Discord

This setup sends successful regular StreamElements donations to a dedicated Discord channel. Game-request payments containing a `TG-` request code are excluded so they remain in the existing game-request Discord route.

## Setup

The production deployment is hosted in the consolidated **Polls | Appeals Center** Supabase project.

1. Add `DISCORD_DONATIONS_WEBHOOK`, `STREAMELEMENTS_ACCOUNT_ID`, and `STREAMELEMENTS_JWT` to Supabase Edge Function Secrets.
2. Deploy `notify-regular-donations` from `supabase/functions/notify-regular-donations/index.ts` with JWT verification enabled.
3. Store the project's legacy `service_role` key in Supabase Vault as `game_request_service_role_key`. Never place the key in this repository.
4. Set `regular_donation_notifier_state.started_at` to the production activation time so older donations are not announced.
5. Schedule `notify-regular-donations` through `pg_cron` and `pg_net` every minute (`* * * * *`). Read the service-role key from Vault and send it in both the `apikey` and `Authorization: Bearer` headers.
6. Confirm that the `notify-regular-donations` Cron job exists and is active. Do not generate fake donations for routine verification.

## Discord message

The notification contains only:

- donor display name (or Anonymous)
- donated amount and currency
- public tip message
- StreamElements as the platform
- donation time

PayPal email addresses and private payment information are never sent to Discord or stored by this notifier.

## Safety

- Each StreamElements tip ID is claimed in a private database table before Discord is called, preventing repeated announcements.
- A failed Discord post releases the claim so the next scheduled run can retry it.
- Messages containing a game-request code such as `TG-12AB34CD56` are ignored.
- Existing game-request payment confirmation remains unchanged.
