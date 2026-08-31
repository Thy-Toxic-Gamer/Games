# Public Next Viewer Request Setup

The website panel is hidden unless the database returns a paid, approved request with a future schedule.

## Activate the panel

1. Open the Supabase project.
2. Open **SQL Editor** and create a new query.
3. Paste the complete contents of `RUN-THIS-v10.8-PUBLIC-SCHEDULE.sql`.
4. Select **Run**.
5. Refresh the public catalog.

If no eligible request is scheduled, the panel remains hidden. Once staff schedules a paid and approved request, the panel appears automatically and refreshes every 60 seconds while the catalog is open.

## Public information boundary

The public function returns only:

- Game title
- Console or system
- Request type
- Scheduled date and time

It does not return Twitch names, viewer IDs, request IDs, notes, payment references, payment amounts, staff identities, or Discord information.
