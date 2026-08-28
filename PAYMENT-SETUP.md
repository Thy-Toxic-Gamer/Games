# Automatic StreamElements Payment Setup

The secure automatic payment flow uses the Supabase Edge Function in `supabase/functions/check-game-request-payment/`.

## One-time setup

1. Run `RUN-THIS-v9.0-AUTOMATIC-PAYMENTS.sql` in the Supabase SQL editor.
2. Deploy the `check-game-request-payment` Edge Function with JWT verification enabled.
3. Add `STREAMELEMENTS_ACCOUNT_ID` and `STREAMELEMENTS_JWT` through Supabase Edge Function Secrets. Use the credentials for the connected StreamElements channel that owns the public tipping page. In the current ThyToxicGamer setup, that is the YouTube-linked channel; Twitch remains the viewer sign-in and request identity. Never place the private JWT in GitHub.
4. Publish the updated website files.

## Payment matching

- Staff approval changes a request to `awaiting_payment`.
- Supabase assigns a unique code such as `TG-12AB34CD56` and a 48-hour deadline.
- The viewer opens the ThyToxicGamer StreamElements tip page, sends at least the required amount, and pastes the code into the tip message.
- The signed-in status page checks for the matching successful StreamElements payment.
- The Edge Function reads the tipping channel's recent and pending moderation records first, with the StreamElements activity feed retained as a fallback.
- A matching tip can approve only one request. The database records its StreamElements tip ID, provider, currency, amount, and confirmation time.
- The 14-day global cooldown begins only after the confirmed payment changes the request to `approved`.
