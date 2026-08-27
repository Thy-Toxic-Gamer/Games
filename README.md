# ThyToxicGamer Game Library

A GitHub Pages-ready visual catalog of ThyToxicGamer's multi-platform game
library. It currently includes 168 games: 93 PC, 47 Nintendo Switch, 24 PS5,
and 4 SNES titles. An **All** tab shows the complete collection in one view. The Xbox tab is marked **Coming Soon**.

## Repository files

- `index.html` — page structure and written content
- `styles.css` — responsive toxic black-and-green design
- `games.js` — the platform catalogs, PC app IDs, and console cover sources
- `app.js` — platform tabs, cover loading, and game-card rendering
- `.nojekyll` — keeps GitHub Pages from processing the files with Jekyll

## Publish with GitHub Pages

1. Upload all six files to the repository root.
2. Open the repository's **Settings**.
3. Select **Pages**.
4. Under **Build and deployment**, choose **Deploy from a branch**.
5. Select the `main` branch and `/ (root)` folder, then save.

The published site will appear at:

`https://thy-toxic-gamer.github.io/Games/`

## Cover art

PC cover art uses current official Steam store artwork. Console artwork uses
verified artwork for the corresponding game and edition. If an image becomes
unavailable, the card displays a branded text fallback.

Castlevania: Belmont's Curse remains in the PC library. Its card is marked
as coming soon until October 15, 2026, then automatically becomes a regular
game card based on the visitor's local date.

## Hover details

Every game card now shows a short story/premise summary and genre when hovered with a mouse or focused with a keyboard. Nintendo Switch, PS5, and SNES cover panels also use a portrait layout so the cover fills the card cleanly without the blurred background showing around it.
