# Automatic VOD Lookup Setup

This upgrade adds a staff-only **Find Latest VODs** button to the completed-request form. It suggests the best recent YouTube and Twitch matches, but staff must confirm the links before publishing.

## Required Supabase secrets

Add these under **Supabase → Edge Functions → Secrets**:

- `YOUTUBE_API_KEY` — a Google Cloud API key with YouTube Data API v3 enabled
- `YOUTUBE_CHANNEL_ID` — the permanent channel ID for ThyToxicGamer

The existing `TWITCH_BROADCASTER_ID` secret is reused. Twitch lookup uses the fresh Twitch sign-in token already held by Staff Control, so no Twitch client secret is added.

Never place API keys or Twitch tokens in GitHub, browser JavaScript, screenshots, or Discord.

## Deploy the Edge Function

Deploy `supabase/functions/find-latest-vods/index.ts` as `find-latest-vods` with JWT verification enabled.

## Staff workflow

1. Open **Staff Control → Request Records**.
2. Select **Mark Request Complete** on a paid and approved request.
3. Select **Find Latest VODs**.
4. Review the titles and URLs filled into YouTube and Twitch.
5. Correct either URL manually if the stream restarted or the suggested match is not the requested stream.
6. Select **Publish Completed Stream** only after confirming both links.

If Twitch reports that the session must be refreshed, sign out of Staff Control and sign in with Twitch again. If a VOD has not finished processing, wait a few minutes and retry.
