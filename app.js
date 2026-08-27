(function () {
  "use strict";

  const games = Array.isArray(window.GAME_LIBRARY) ? window.GAME_LIBRARY : [];
  const grid = document.querySelector("#game-grid");
  const headerCount = document.querySelector("#header-count");
  const libraryCount = document.querySelector("#library-count");
  const upcomingArt = document.querySelector("#upcoming-art");

  const headerFallbacks = Object.freeze({
    11610: "https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/11610/header.jpg?t=1516788252",
    109600: "https://shared.fastly.steamstatic.com/store_item_assets/steam/apps/109600/b45ba04297b16c13373f491bcd6bda81e6cda1d6/header.jpg?t=1781552751",
    2062430: "https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/2062430/5e7885a3802fe7d38b92fdeb44888b4828a842ba/header_alt_assets_2.jpg?t=1786035856",
    238960: "https://shared.fastly.steamstatic.com/store_item_assets/steam/apps/238960/177c953b362c5a6221f9c15d340a0b1e2b8bfab8/header.jpg?t=1784681738",
    292140: "https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/292140/header.jpg?t=1775177243",
    295550: "https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/295550/header.jpg?t=1782985043",
    2694490: "https://shared.fastly.steamstatic.com/store_item_assets/steam/apps/2694490/24eeddcbda17903f03d819588757e40845f8115f/header.jpg?t=1787697213",
    292030: "https://shared.fastly.steamstatic.com/store_item_assets/steam/apps/292030/97cca1147b256f450331044255b1dbd2d57d609e/header_alt_assets_4.jpg?t=1787688132",
    345350: "https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/345350/header.jpg?t=1775177550",
    1374490: "https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/1374490/6f6bba2ddccb49f3a0abb831684ca085e453c721/header_alt_assets_3.jpg?t=1785893866",
    3265700: "https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/3265700/5590e42cab09dacabee973dd2c3e27ef12ed4950/header.jpg?t=1776925935",
    3590290: "https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/3590290/e0279893a393cecd472e1475d16ddb648aad15a3/header.jpg?t=1785164308",
    3837340: "https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/3837340/467568ecc51ea77191ce048636a6f211c1c93a9f/header.jpg?t=1775108423",
    4231820: "https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/4231820/6b65aec2c398006aea8b76e1463cc34d0e4ba68b/header.jpg?t=1785458750",
    892970: "https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/892970/de0bdcf6c008c508a79d8e75eb91fc67f4bebd5d/header.jpg?t=1786012504",
    3041230: "https://shared.fastly.steamstatic.com/store_item_assets/steam/apps/3041230/7e838d87d787735d5d29d72777c5ee55653dfb2b/header.jpg?t=1783932953",
  });

  const preferredHeaderCovers = new Set([
    109600,
    238960,
    2694490,
    292030,
    892970,
    3041230,
  ]);

  function coverUrl(appId, alternate) {
    if (preferredHeaderCovers.has(appId)) {
      return alternate
        ? `https://cdn.cloudflare.steamstatic.com/steam/apps/${appId}/library_600x900.jpg`
        : headerFallbacks[appId];
    }

    if (alternate) {
      return headerFallbacks[appId]
        || `https://cdn.cloudflare.steamstatic.com/steam/apps/${appId}/library_600x900.jpg`;
    }

    return `https://shared.fastly.steamstatic.com/store_item_assets/steam/apps/${appId}/library_600x900.jpg`;
  }

  function initials(title) {
    return title
      .replace(/[^A-Za-z0-9 ]/g, " ")
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 3)
      .map((word) => word[0])
      .join("")
      .toUpperCase() || "GAME";
  }

  function createCover(game, eager) {
    const shell = document.createElement("div");
    shell.className = "cover-shell";

    const fallback = document.createElement("span");
    fallback.className = "cover-fallback";
    fallback.textContent = initials(game.title);
    fallback.setAttribute("aria-hidden", "true");

    const image = document.createElement("img");
    image.className = "game-cover";
    image.src = coverUrl(game.appId, false);
    image.alt = `${game.title} cover art`;
    image.loading = eager ? "eager" : "lazy";
    image.decoding = "async";
    image.dataset.coverAttempt = "0";

    if (preferredHeaderCovers.has(game.appId)) {
      image.classList.add("landscape-cover");
    }

    image.addEventListener("error", function () {
      if (image.dataset.coverAttempt === "0") {
        image.dataset.coverAttempt = "1";
        if (preferredHeaderCovers.has(game.appId)) {
          image.classList.remove("landscape-cover");
        } else if (headerFallbacks[game.appId]) {
          image.classList.add("landscape-cover");
        }
        image.src = coverUrl(game.appId, true);
        return;
      }

      image.remove();
      shell.classList.add("cover-unavailable");
    });

    shell.append(fallback, image);
    return shell;
  }

  function createGameCard(game, index) {
    const card = document.createElement("a");
    card.className = "game-card";
    card.href = `https://store.steampowered.com/app/${game.appId}/`;
    card.target = "_blank";
    card.rel = "noopener noreferrer";
    card.setAttribute("aria-label", `View ${game.title} on Steam`);

    if (game.releaseDate) {
      card.classList.add("upcoming-game");
    }

    const cover = createCover(game, index < 8);

    const details = document.createElement("div");
    details.className = "game-details";

    const number = document.createElement("span");
    number.className = "game-number";
    number.textContent = `#${String(game.number).padStart(3, "0")}`;

    const title = document.createElement("h3");
    title.textContent = game.title;

    details.append(number, title);

    if (game.releaseDate) {
      const release = document.createElement("p");
      release.className = "card-release";
      release.textContent = `Coming ${game.releaseDate}`;
      details.append(release);
    }

    card.append(cover, details);
    return card;
  }

  function renderUpcomingCover() {
    if (!upcomingArt) return;

    const upcomingGame = games.find((game) => game.releaseDate);
    if (!upcomingGame) return;

    upcomingArt.append(createCover(upcomingGame, true));
  }

  function renderLibrary() {
    if (!grid || !headerCount || !libraryCount) return;

    headerCount.textContent = String(games.length);
    libraryCount.textContent = String(games.length);

    const fragment = document.createDocumentFragment();
    games.forEach((game, index) => {
      fragment.append(createGameCard(game, index));
    });

    grid.replaceChildren(fragment);
  }

  renderUpcomingCover();
  renderLibrary();
})();
