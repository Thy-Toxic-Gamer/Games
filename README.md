# ThyToxicGamer Game Library — Professional Dashboard

GitHub Pages-ready version of the ThyToxicGamer game catalog.

## Ver. 1.2 — Discord Request-System Health — Updated August 30, 2026

- Added a private Discord Notifications health panel to Staff Control.
- Verified staff can send a safe test notification to `#request-system-logs`.
- Successful and failed request notifications now create a protected server-side delivery record.
- Unresolved failures can be retried without exposing webhook addresses or private delivery payloads to the browser.
- The system-log channel receives delivery confirmations and failure alerts for game-request activity.
- Resolved retry payloads are cleared, and delivery records older than 90 days are removed during health checks.
- Included `RUN-THIS-v10.7-DISCORD-HEALTH.sql` and `DISCORD-HEALTH-SETUP.md`.

## Ver. 1.1 — Viewer Game Change Requests — Updated August 30, 2026

- Added a Request a Game Change button to each eligible viewer Request Status card.
- Viewers can request a replacement title and console or system while keeping the original request type, price bracket, payment reference, and approval state locked.
- New change requests are sent to the pending Discord staff channel for review.
- Staff Control can apply the requested replacement through the existing secure editor or deny it with a required explanation.
- The viewer status page shows pending, approved, and denied change-request decisions.
- Added secure database checks so only the original signed-in viewer can submit a change and only verified staff can approve or deny it.

## Ver. 1.0 — First Public Release — Updated August 29, 2026

- Added the viewer-facing Site Updates center and prominent shortcut.
- Clarified the Friday evening or Saturday morning 18–24 hour stream window.
- Kept SNES in its compact front-page section while giving two rotating games the same wide picture, number/title, and request-button presentation as the PC cards.
- Expanded the SNES library from 4 to 45 alphabetized games using the verified collections supplied by the owner.
- Changed the All tab to black, PC to bright yellow, and Xbox to dark green.
- Applied the bright-yellow PC scheme to its dashboard panel, full library, cards, and request controls.
- Matched every Full Collection label and game-count badge to its platform color.
- Added a white NES Emulation tab marked Coming Soon and labeled both NES and SNES as emulation libraries.
- Current Twitch moderators can receive Staff Control automatically after secure server-side Twitch verification.
- Existing owner and manually assigned staff access is preserved.
- Automatic moderators must reauthorize after leaving Staff Control, and removed moderators lose access.
- Paid and approved requests can optionally be scheduled for an exact Eastern date and time after everyone agrees.
- Rescheduling or clearing an existing game time requires a written reason.
- Viewers see the recorded schedule on their request-status page.
- Discord can announce schedule, reschedule, and schedule-cleared updates without duplicating payment approval notices.
- The Ver. 1.0 database setup retains its original internal migration filenames for deployment compatibility.

## Version 7.0 — Game Request Phase 1 Test

- Added a test-mode request center and status display to the catalog.
- Added Request This Game controls to every game card.
- Added a one-viewer-slot browser test flow, requester status page, and toxic-styled review panel.
- Added pre-approval, required denial explanations, test payment completion, approved status, and 14-day cooldown simulation.
- This phase intentionally uses browser storage only. It is not the final secure multi-user, Discord, Twitch, or payment integration.

## Version 6.8 — Correct Witcher Sequence

- The Witcher: Enhanced Edition is now PC game #079.
- The Witcher 2 moves to #080 and The Witcher 3 moves to #081.

## Version 6.7 — Root-Level Switch Artwork Fix

- Moved the Atelier Ryza and Code of Princess EX PNGs to the repository root and updated their game entries to use simple root-level paths.
- This prevents blank fallback tiles when GitHub uploads do not preserve the nested artwork folders.

## Version 6.6 — Restored Supplied Switch Covers

- Replaced Atelier Ryza Secret Trilogy Deluxe Pack and Code of Princess EX with the newly supplied local PNG files.
- Both covers now receive the explicit full-cover treatment in their cards and hover previews, preventing cropping.

## Version 6.5 — Never-Crop Code of Princess EX

- Code of Princess EX now receives an explicit full-cover class in both its Switch card and hover preview, guaranteeing the entire supplied cover remains visible.

## Version 6.4 — Complete Code of Princess EX Artwork

- Code of Princess EX now shows the entire supplied Nintendo Switch cover inside its card instead of cropping the artwork.

## Version 6.3 — PC Tab-Style Front Panel

- The PC front panel now uses the same wide Steam artwork, card proportions, numbering, titles, spacing, and wrapping grid as the full PC tab.
- The PC preview displays 12 games in two six-card rows on wide screens, matching the supplied reference.
- Responsive columns keep every preview inside the panel without overlap or horizontal overflow.

## Version 6.2 — Matching Tab Covers + Responsive PC Showcase

- Atelier Ryza Secret Trilogy Deluxe Pack and Code of Princess EX now use the supplied local Nintendo Switch artwork.
- PC front-page cards now reuse the exact artwork shown in the PC tab instead of loading separate portrait covers.
- The PC front-page showcase still displays exactly 22 games.
- Responsive column counts now keep all PC cards inside the panel without overlap or horizontal overflow.

## Included changes

- Professional multi-platform dashboard on the **All** tab
- Platform-specific visual accents:
  - All: black
  - PC: bright yellow
  - Nintendo Switch: red
  - PS5: blue
  - NES Emulation: white / Coming Soon
  - SNES Emulation: purple
  - Xbox: dark green / Coming Soon
- Nintendo Switch preview panel across the top
- PC, PS5, and SNES preview panels below it
- Compact proportional box art so console covers fit without oversized cropping
- Hover/focus detail card with cover art, platform, genre, and short story description
- `View all` buttons jump directly to each full platform library
- Nintendo Switch Final Fantasy I–VI remain separate titles
- All tab remains available
- Cache-busting query strings use version `5.3`

## Upload to GitHub

Upload these files to the root of the `Thy-Toxic-Gamer/Games` repository and replace the existing versions:

- `index.html`
- `styles.css`
- `games.js`
- `app.js`
- `dashboard.css`
- `dashboard.js`
- `.nojekyll`

After GitHub Pages redeploys, refresh the website with `Ctrl + F5` once.

Published site:

https://thy-toxic-gamer.github.io/Games/


## Version 5.0 — System Box Art Presentation

Console covers now use a system-authentic presentation:
- Nintendo Switch: red Switch retail header
- PS5: white PS5 retail header
- SNES: black/silver Super Nintendo-era header
- Existing game artwork stays fully visible inside the case treatment
- Professional platform dashboard and hover genre/story panel remain intact

Upload all files in this package to the repository root and replace the older files.


## Version 5.1 — Cover Layout Fix

This patch fixes the v5 console-cover display issue:
- Real Switch, PS5, and SNES artwork fills the entire portrait case.
- System headers now overlay the artwork instead of taking up a separate grid row.
- Large green abbreviation fallbacks remain hidden whenever artwork loads successfully.
- Fallback initials only appear if an image genuinely fails to load.
- Hover genre/story details and the professional dashboard remain unchanged.


## Version 5.2 — Portrait Cover Artwork

This pass corrects the remaining visual mismatch:
- Steam-backed Switch and PS5 entries use portrait 600x900 artwork instead of landscape header art.
- FINAL FANTASY I–VI use their individual portrait Pixel Remaster artwork.
- Portrait artwork is shown in full with no zoom/crop.
- Remaining horizontal Nintendo/store artwork is contained instead of enlarged.
- Switch / PS5 / SNES system headers, platform colors, and hover story/genre panels remain.


## Version 5.3 — Reference Dashboard Match

- The All tab opens with a compact Nintendo Switch showcase.
- Sixteen Switch covers form an 11-card first row and five-card second row on desktop.
- FINAL FANTASY VI is selected initially in an inline detail panel matching the reference layout.
- Selecting or focusing another Switch card updates the inline cover, title, genre, and description.
- PC, PS5, and SNES remain in three compact preview panels below the Switch section.
- Every preview card now includes a small genre label; PC cards also show Steam.


## Version 5.4 — PC Featured + Clean Artwork

- PC now occupies the featured top position previously used by Nintendo Switch.
- Nintendo Switch moves into the lower dashboard row with PS5 and SNES.
- Removed generated Switch / PS5 / SNES packaging logos and system banners.
- Cover images fill their card slots precisely with centered cropping.
- Artwork sources should be clean game/key art rather than platform-branded box fronts whenever available.
- Cache-busting query strings updated to version `5.4`.


## Version 5.5 — Unified Hover Details

- Removed the large persistent PC detail panel from the All dashboard.
- PC is still the wide featured section and now previews up to 16 games.
- Nintendo Switch preview returns to a compact five-card lower panel.
- Every game card, including PC, Switch, PS5, SNES, and full-library cards, uses the same hover/focus detail popup with cover art, platform, genre, and game description.
- Cache-busting query strings updated to version `5.5`.


## Version 5.6 — PC 22-Game Showcase + Switch Artwork Cleanup

- PC showcase now displays 22 games (two 11-card rows on wide desktop layouts).
- BALL x PIT uses its dedicated 600x900 Steam library capsule in the PC showcase instead of the horizontal header fallback.
- Replaced several Switch sources that were horizontal or packaging-heavy with cleaner game-specific artwork that does not include the Nintendo Switch system banner.
- Existing hover/focus genre and About the Game detail behavior remains unchanged.
- Cache-busting query strings updated to version 5.6.


## Version 5.7 — Unified Portrait Artwork

- Dashboard and full Switch/PS5/SNES cards use portrait-safe artwork sizing.
- Artwork fills the shared portrait slot without stretching; landscape sources are cropped rather than displayed as horizontal cards.
- The unreleased PC **Castlevania: Belmont's Curse** entry remains allowed to display contained landscape art.
- Failed artwork receives a generated cover-style fallback instead of leaving an empty card.
- PC entries 55–57 are ordered as Ninja Gaiden Σ, Ninja Gaiden Σ2, and Ninja Gaiden 3: Razor's Edge.
- Cache-busting query strings updated to version 5.7.


## Version 5.8 — Portrait Artwork and Alphabetical Catalog

- Replaced the requested Switch artwork with portrait-transformed clean artwork.
- All PC, Nintendo Switch, PS5, SNES, and All Games displays now sort alphabetically.
- Dashboard previews preserve the same alphabetical order.
- Cache-busting query strings updated to version 5.8.


## Version 6.0 — Repository-Hosted Switch Artwork

- Added user-approved local artwork files for Goblin Sword, Minecraft, Pokémon Shield, Super Mario Maker 2, Super Mario Odyssey, The Legend of Zelda: Skyward Sword HD, and Paper Mario: The Origami King.
- Mapped each uploaded cover to its matching Nintendo Switch catalog entry.
- Renamed the PS5 entry to **Horizon Forbidden West Digital Deluxe**.
- Cache-busting query strings updated to version 6.0.


## Version 6.1 — Rotating Dashboard and Updated Artwork

- Added the supplied Season 4 artwork for The First Descendant on PS5.
- Added the supplied portrait artwork for Castlevania: Belmont's Curse on the PC dashboard.
- Replaced the incomplete Minecraft, Paper Mario: The Origami King, and Super Mario Maker 2 repository images with their complete files.
- PC, Nintendo Switch, and PS5 dashboard selections now randomize every 20 seconds; rotation pauses while a dashboard card is being hovered or focused.
- SNES remains fixed because its section contains four games.
- Full platform libraries remain alphabetized.
- Cache-busting query strings updated to version 6.1.

## Version 7.1 — Unlisted Game Requests

- Added a **Can't find the game?** message bar above the catalog.
- Viewers can type a game that is not in the catalog and submit it through the same review flow.
- Unlisted requests are clearly marked **Unlisted Game · Higher Request Price** while exact prices remain undecided.
- Catalog and unlisted requests share the same one-viewer request slot, approval/denial process, test payment step, and 14-day cooldown.
- Cache-busting query strings updated to version 7.1.

## Version 7.2 — Viewer Request Cancellation

- Added **Cancel My Request** to the viewer status page while a request is pending review.
- Cancellation requires confirmation and records the status as **Cancelled by Viewer**.
- A cancelled request immediately reopens the single viewer request slot.
- Requests can no longer be cancelled after pre-approval or payment.
- Cache-busting query strings updated to version 7.2.

## Version 7.3 — Request Pricing Tiers

- Every owned game tile now displays **Request for $5+**.
- The unlisted-game bar now displays **Request for $10+** and explains the $10 minimum.
- Catalog requests are recorded as **Owned Game · $5 Minimum**.
- Games not in the catalog are recorded as **Not in Catalog · $10 Minimum**.
- Approval still happens before any payment option is shown.
- Cache-busting query strings updated to version 7.3.

## Version 8.0 — Live Twitch and Supabase Requests

- Replaced browser-only request storage with the shared Supabase database.
- Added Twitch sign-in and automatic Twitch-account identification.
- Added real authenticated catalog and unlisted-game submissions.
- Added a live viewer status page that reads only the signed-in viewer's records.
- Added secure pending-request cancellation through a database function.
- Added public request-slot and viewer-cooldown state without exposing another viewer's information.
- Kept the $5 catalog and $10 unlisted minimum pricing tiers.
- Included `supabase-request-system.sql`, which must be run once before publishing version 8.0.
- The owner review dashboard and Discord delivery remain disabled until the owner account is assigned in the next stage.

## Version 8.1 — Global Cooldown Staff Reset

- Changed the 14-day restriction into one global community request cooldown.
- An approved request automatically closes new requests for 14 days.
- Added a private Twitch-authenticated staff control page.
- Owners and authorized staff can confirm **Reset Global Cooldown** to reopen requests immediately.
- Resetting makes every viewer eligible again, including the viewer whose request started the cooldown.
- Staff cooldown bypass remains supported through the staff permission record.

## Version 8.2 — Authentication Button Display Fix

- Fixed hidden authentication controls being forced visible by the shared button display style.
- Signed-in viewers and staff now see only **Sign Out**.
- Signed-out visitors now see only **Sign in with Twitch**.
- Cache-busting query strings updated to version 8.2.

## Version 8.3 — Live Approval and Denial Dashboard

- Added the live pending-request card to the private staff dashboard.
- Authorized reviewers can approve a pending request into **Awaiting Payment**.
- Denial requires a written explanation of up to 500 characters.
- The viewer sees the denial explanation on their request-status page.
- Added recent request history for awaiting-payment, approved, denied, expired, and cancelled records.
- Approval reserves the request slot but does not start the 14-day cooldown; payment confirmation will start it later.
- Included the one-time `RUN-THIS-v8.3-REVIEW-DASHBOARD.sql` database upgrade.

## Version 8.4 — Automatic Request Archive

- Completed requests remain in **Recent Requests** for 30 days, then move to the staff-only **Archive**.
- Archived requests are permanently deleted after spending six months in the Archive.
- Pending and awaiting-payment requests are never archived or deleted by retention maintenance.
- Maintenance runs automatically once each day through Supabase Cron.
- Included the one-time `RUN-THIS-v8.4-ARCHIVE-RETENTION.sql` database upgrade.

## Version 8.5 — Awaiting Request Controls

- The live staff queue now displays both pending and awaiting-payment requests.
- Added a confirmed **Cancel Awaiting Request** staff control with a required explanation.
- Staff cancellation immediately releases the single request slot.
- The viewer sees the cancellation explanation on the request-status page.
- Awaiting requests show their automatic expiration deadline in Staff Control.
- Awaiting requests automatically expire after 48 hours, checked every five minutes.
- Included the working Discord router source under `supabase/functions/discord-game-requests/` without private secret values.
- Included the reusable `RUN-THIS-v8.5-AUTO-EXPIRY.sql` maintenance script.
- Included the one-time `RUN-THIS-v8.5-STAFF-AWAITING-CANCEL.sql` database upgrade.

## Version 8.6 — Live Viewer Status

- The viewer status page now refreshes automatically every 15 seconds without page flicker.
- Awaiting requests display a live days, hours, minutes, and seconds countdown.
- Added a visible live-status indicator and last-checked time.
- Returning to the browser tab triggers an immediate status refresh.
- Updated the repository Discord function backup with Cancelled and Expired routing.

## Version 9.0 — Automatic StreamElements Payments

- Added the real StreamElements tip link to requests approved for payment.
- Added a unique payment reference for every awaiting-payment request.
- Added secure automatic payment matching through a Supabase Edge Function.
- StreamElements credentials stay in Supabase secrets and never enter GitHub Pages.
- Successful tips must contain the exact request reference and meet the $5 or $10 minimum.
- A StreamElements tip can approve only one request.
- Confirmed payments record the provider, currency, amount, tip ID, and paid time before starting the 14-day global cooldown.
- Preserved the version 8.6 live refresh, countdown, last-checked time, and tab-return refresh behavior.
- Included `RUN-THIS-v9.0-AUTOMATIC-PAYMENTS.sql` and `PAYMENT-SETUP.md`.

## Version 9.1 — Global Service Switch

- Added a staff-only ON/OFF switch for new game-request submissions.
- Turning services OFF immediately blocks only brand-new request submissions.
- Existing requests continue through review, StreamElements payment, confirmation, and normal expiration without interruption.
- The manual service switch is separate from the automatic 14-day global cooldown and stays OFF until staff turns it back ON.
- Added server-side enforcement so stale or bypassed website pages cannot submit a new request while services are OFF.
- Included `RUN-THIS-v9.1-GLOBAL-SERVICE-SWITCH.sql`.

## Version 9.2 — Verified Payment Channel and Status Labels

- Updated the repository Edge Function backup to match the successfully tested StreamElements payment checker.
- Payment matching now reads the StreamElements channel that owns the public tipping page, which is the connected YouTube channel in the current setup; Twitch remains the viewer request identity.
- Restored the production `$5` catalog and `$10` unlisted-game minimums after the live `$1` verification test.
- Staff-approved requests display **Approved · Awaiting Payment** until payment is confirmed.
- Confirmed requests display **Paid & Approved** on both staff review and viewer status pages.

## Version 9.3 — Regular Donations to Discord

- Added a separate scheduled notifier for successful StreamElements donations that are not game-request payments.
- Regular donations post the donor display name, amount, message, platform, and time to a dedicated Discord webhook.
- Tips containing a `TG-` game-request code remain in the existing game-request Discord route and are not posted twice.
- Added private tip-ID tracking so each donation is announced only once and failed Discord posts can retry safely.
- Older donations made before setup are ignored.
- Included `RUN-THIS-v9.3-REGULAR-DONATIONS.sql` and `REGULAR-DONATIONS-SETUP.md`.

## Version 10.4 — Staff Request Corrections

- Added a staff-only **Edit Request** control for pending, awaiting-payment, and paid/approved requests before the scheduled stream begins.
- Staff can correct the game title or console/system while the original request category, play style, payment amount, payment reference, and status remain locked.
- Every correction requires an explanation and is stored in a permanent request-change audit table.
- The viewer request-status page shows the previous game/system, corrected selection, explanation, and update time.
- Discord receives a **Game Request Updated** notice with the previous and corrected request details.
- Included the one-time `RUN-THIS-v10.4-REQUEST-EDITS.sql` database upgrade.
