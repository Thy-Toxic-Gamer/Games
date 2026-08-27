# ThyToxicGamer Game Library

A GitHub Pages-ready visual catalog of all 92 games in ThyToxicGamer's library.

## Repository files

- `index.html` — page structure and written content
- `styles.css` — responsive toxic black-and-green design
- `games.js` — the complete 92-game catalog and Steam app IDs
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

Cover art is loaded from official Steam store assets by app ID. If Steam does
not provide a vertical cover for a title, the card automatically displays a
branded text fallback instead.
