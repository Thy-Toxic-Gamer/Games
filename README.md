# ThyToxicGamer Game Library

A GitHub Pages-ready visual catalog of all 93 games in ThyToxicGamer's library.

## Repository files

- `index.html` — page structure and written content
- `styles.css` — responsive toxic black-and-green design
- `games.js` — the complete 93-game catalog and Steam app IDs
- `app.js` — cover loading and game-card rendering
- `.nojekyll` — keeps GitHub Pages from processing the files with Jekyll

## Publish with GitHub Pages

1. Upload all five files to the repository root.
2. Open the repository's **Settings**.
3. Select **Pages**.
4. Under **Build and deployment**, choose **Deploy from a branch**.
5. Select the `main` branch and `/ (root)` folder, then save.

The published site will appear at:

`https://thy-toxic-gamer.github.io/Games/`

## Cover art

Cover art uses the current official Steam store header for each app ID. If a
header becomes unavailable, the card tries Steam's library cover and then a
branded text fallback.

Castlevania: Belmont's Curse remains in the 93-game library. Its card is marked
as coming soon until October 15, 2026, then automatically becomes a regular
game card based on the visitor's local date.
