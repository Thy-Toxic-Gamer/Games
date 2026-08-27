# ThyToxicGamer Game Library — Professional Dashboard

GitHub Pages-ready version of the ThyToxicGamer game catalog.

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
