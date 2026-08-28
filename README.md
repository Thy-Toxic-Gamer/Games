# ThyToxicGamer Game Library — Professional Dashboard

GitHub Pages-ready version of the ThyToxicGamer game catalog.

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
  - All: toxic green
  - PC: green
  - Nintendo Switch: red
  - PS5: blue
  - SNES: purple
  - Xbox: neutral / Coming Soon
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
