# Discord Request-System Health Setup

This upgrade adds a private Staff Control health panel, delivery history, a safe test button, and retries for unresolved Discord failures.

## One-time setup

1. In the Supabase SQL Editor, run `RUN-THIS-v10.7-DISCORD-HEALTH.sql`.
2. Confirm the Edge Function secret `DISCORD_SYSTEM_LOG_WEBHOOK_URL` contains the private webhook for `#request-system-logs`.
3. Deploy `supabase/functions/discord-notification-health/index.ts` as the `discord-notification-health` Edge Function with JWT verification enabled.
4. Redeploy `supabase/functions/discord-game-requests/index.ts` as the existing `discord-game-requests` Edge Function. Its `x-webhook-token` header must match the `DATABASE_WEBHOOK_SECRET` Edge Function secret.
5. Open Staff Control, sign in with Twitch, and select **Send Test Notification**.
6. Confirm the green test message appears in `#request-system-logs` and Staff Control changes to **Connected**.

## What it records

- Successful request-notification deliveries without retaining their message payload.
- Failed deliveries with the minimum payload required for a staff retry.
- Test-notification results and failed system-log alerts.
- Delivery HTTP status, safe error details, event type, request ID, and timestamp.

Only the Supabase service role can access the delivery table. Staff Control receives a sanitized status response from the authenticated Edge Function. Resolved retry payloads are cleared, and records older than 90 days are removed during health checks.

Never place Discord webhook URLs, Supabase service-role keys, OAuth tokens, or StreamElements credentials in GitHub or browser JavaScript.
