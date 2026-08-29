# Regular StreamElements Donations to Discord

This setup sends successful regular StreamElements donations to a dedicated Discord channel. Game-request payments containing a `TG-` request code are excluded so they remain in the existing game-request Discord route.

## Setup

1. Add the Discord channel webhook to Supabase Edge Function Secrets as `DISCORD_DONATIONS_WEBHOOK`.
2. Run `RUN-THIS-v9.3-REGULAR-DONATIONS.sql` once in the Supabase SQL Editor. The setup time is recorded so older donations are not posted.
3. Create and deploy the Edge Function `notify-regular-donations` using `supabase/functions/notify-regular-donations/index.ts`.
4. Disable JWT verification for this server-to-server function. The function itself requires the Supabase secret key on the `apikey` header and rejects calls without it.
5. In Supabase, open **Integrations → Cron**, create a job named `notify-regular-donations`, select the Supabase Edge Function, run it every minute (`* * * * *`), set the maximum 5,000 ms timeout, and use **Add secret key** under HTTP Headers.
6. Check the Cron job history and Edge Function logs after the first run.

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
