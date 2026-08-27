(function () {
  "use strict";

  const library = window.GAME_LIBRARY || { platforms: [], totalGames: 0 };
  const platforms = Array.isArray(library.platforms) ? library.platforms : [];
  const allGames = platforms
    .filter((platform) => !platform.comingSoon)
    .flatMap((platform) => platform.games.map((game) => ({ ...game, sourcePlatformId: platform.id })));
  const viewPlatforms = [
    { id: "all", label: "All", games: allGames },
    ...platforms,
  ];
  const grid = document.querySelector("#game-grid");
  const headerCount = document.querySelector("#header-count");
  const tabs = document.querySelector("#platform-tabs");
  const panel = document.querySelector("#platform-panel");
  const platformName = document.querySelector("#platform-name");
  const libraryCount = document.querySelector("#library-count");
  const comingSoon = document.querySelector("#xbox-coming-soon");
  let activePlatformId = "all";

  const currentHeaderImages = Object.freeze({
    1029210: "https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/1029210/4e755d52979ed36dd7a7bfef3ad98d93f07922d0/header.jpg?t=1781208599",
    761890: "https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/761890/ea5ce1793872e23cc9ce82ac1f317869c67469b6/header_alt_assets_2.jpg?t=1787224203",
    1172470: "https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/1172470/6cf04767652d703b6050da84b82cfb1194258d7d/header.jpg?t=1786031871",
    1147660: "https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/1147660/header.jpg?t=1707816982",
    2399830: "https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/2399830/d934813ca531af0fce69fe36bc972f1c90d1aa19/header.jpg?t=1779293241",
    649950: "https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/649950/header.jpg?t=1729099459",
    2208920: "https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/2208920/header.jpg?t=1786637382",
    2062430: "https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/2062430/5e7885a3802fe7d38b92fdeb44888b4828a842ba/header_alt_assets_2.jpg?t=1786035856",
    681660: "https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/681660/header.jpg?t=1591758842",
    738520: "https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/738520/5d14286459f7eaaeb0e5e5f7ad959f03ee724f25/header_alt_assets_1.jpg?t=1786133858",
    4231820: "https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/4231820/6b65aec2c398006aea8b76e1463cc34d0e4ba68b/header.jpg?t=1785458750",
    1903340: "https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/1903340/be3305b02d4db0dffa3458537118423bf2792d7e/header.jpg?t=1782830877",
    588650: "https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/588650/header.jpg?t=1779086887",
    744900: "https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/744900/header.jpg?t=1741095278",
    2321470: "https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/2321470/header.jpg?t=1787051272",
    1085660: "https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/1085660/0ccf0dc0a8c4ec078db7ab99ddc820b2fa884441/header.jpg?t=1781815889",
    337000: "https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/337000/39cf848b5d93541865bdf81e1f415cc615de5d80/header.jpg?t=1780670420",
    3590290: "https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/3590290/e0279893a393cecd472e1475d16ddb648aad15a3/header.jpg?t=1785164308",
    379720: "https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/379720/header.jpg?t=1750784856",
    2280: "https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/2280/header.jpg?t=1750785073",
    9050: "https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/9050/header.jpg?t=1660240082",
    208200: "https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/208200/header.jpg?t=1664292843",
    9070: "https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/9070/header.jpg?t=1660250812",
    1148590: "https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/1148590/header.jpg?t=1750784988",
    782330: "https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/782330/feaf8293bcd2d078422faa547bc0d707c08f606e/header.jpg?t=1783432602",
    3017860: "https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/3017860/af14846bdc72d46a4207c24d9ada4dc54595cc2d/header_alt_assets_2.jpg?t=1783452885",
    11610: "https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/11610/header.jpg?t=1516788252",
    970830: "https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/970830/header.jpg?t=1721835298",
    306130: "https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/306130/465cc6917d2ed89c364ebfca85da07f79a2abfd6/header.jpg?t=1783621796",
    1203620: "https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/1203620/062c788d22ecf236269da0f115150c0d3b7055a4/header.jpg?t=1782800102",
    3837340: "https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/3837340/467568ecc51ea77191ce048636a6f211c1c93a9f/header.jpg?t=1775108423",
    292120: "https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/292120/header.jpg?t=1775176878",
    292140: "https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/292140/header.jpg?t=1775177243",
    2074920: "https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/2074920/dc8ac02c8328d66f2f78ea8b83472bdd7e281a62/header.jpg?t=1787211276",
    1593500: "https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/1593500/header.jpg?t=1763059412",
    1496790: "https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/1496790/header.jpg?t=1772146079",
    881020: "https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/881020/header.jpg?t=1783524179",
    1145360: "https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/1145360/header.jpg?t=1758127023",
    1145350: "https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/1145350/91ac334a2c137d08968ccc0bc474a02579602100/header.jpg?t=1779901265",
    619820: "https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/619820/bb367cb7f6d10326c9274383409bb6e5027d3dd7/header_alt_assets_2.jpg?t=1787152133",
    2552430: "https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/2552430/header.jpg?t=1779418330",
    2552440: "https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/2552440/header.jpg?t=1779418696",
    2552450: "https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/2552450/header.jpg?t=1779418883",
    700030: "https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/700030/header.jpg?t=1778671803",
    345350: "https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/345350/header.jpg?t=1775177550",
    1599340: "https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/1599340/header.jpg?t=1763571534",
    216150: "https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/216150/header.jpg?t=1784158414",
    2767030: "https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/2767030/44ca658ecf9b75216cb652f709ced7ccde96d915/header.jpg?t=1786093208",
    1129580: "https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/1129580/header.jpg?t=1787135492",
    1798010: "https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/1798010/header.jpg?t=1769126434",
    1798020: "https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/1798020/header.jpg?t=1769126494",
    109600: "https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/109600/b45ba04297b16c13373f491bcd6bda81e6cda1d6/header.jpg?t=1781552751",
    1369760: "https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/1369760/header.jpg?t=1760595589",
    1580780: "https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/1580780/header.jpg?t=1760595484",
    1580790: "https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/1580790/header.jpg?t=1760595578",
    1371980: "https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/1371980/331de7e745f43867f0a220339153ac6019822ea4/header.jpg?t=1784886886",
    1343370: "https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/1343370/header.jpg?t=1779113374",
    2139460: "https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/2139460/c18b08a2f93dec32fcc5fa71bc2da44ee42de1f0/header.jpg?t=1786675226",
    3046600: "https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/3046600/header.jpg?t=1763712388",
    761600: "https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/761600/header.jpg?t=1784004466",
    680420: "https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/680420/header.jpg?t=1774022529",
    794260: "https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/794260/header.jpg?t=1787229712",
    1623730: "https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/1623730/6912f19c43a95ff5fe514eedd35e68bf12335459/header.jpg?t=1784714419",
    238960: "https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/238960/177c953b362c5a6221f9c15d340a0b1e2b8bfab8/header.jpg?t=1784681738",
    2694490: "https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/2694490/24eeddcbda17903f03d819588757e40845f8115f/header.jpg?t=1787697213",
    1056640: "https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/1056640/cbc2abb55b0996b2ec85242aa11bf29139e46e9f/header_alt_assets_20.jpg?t=1785235324",
    462770: "https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/462770/header.jpg?t=1729114062",
    617290: "https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/617290/header.jpg?t=1764657526",
    1805320: "https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/1805320/7ba6783ca5acd8068abd3bd924801ce173fc39e8/header.jpg?t=1782998088",
    295550: "https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/295550/header.jpg?t=1782985043",
    1343400: "https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/1343400/164e54273831e76f820378b4c6e0c21e0a4834e2/header.jpg?t=1771947591",
    1374490: "https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/1374490/6f6bba2ddccb49f3a0abb831684ca085e453c721/header_alt_assets_3.jpg?t=1785893866",
    2087030: "https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/2087030/header.jpg?t=1757923026",
    414530: "https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/414530/header.jpg?t=1747244593",
    740130: "https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/740130/9031a1f4e34e8031118594726762d7979e43f320/header.jpg?t=1783413316",
    323370: "https://shared.fastly.steamstatic.com/store_item_assets/steam/apps/323370/header.jpg",
    2429640: "https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/2429640/497cc638fa3186f1aeefddaff89eaaf6f0c2e7dd/header.jpg?t=1786601205",
    200710: "https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/200710/header.jpg?t=1782381123",
    372000: "https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/372000/header.jpg?t=1765860167",
    1975440: "https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/1975440/header.jpg?t=1725963350",
    1604030: "https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/1604030/be49834ab147ad22ba17005fb847c93917d18b97/header.jpg?t=1787038382",
    892970: "https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/892970/de0bdcf6c008c508a79d8e75eb91fc67f4bebd5d/header.jpg?t=1786012504",
    3265700: "https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/3265700/5590e42cab09dacabee973dd2c3e27ef12ed4950/header.jpg?t=1776925935",
    212160: "https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/212160/3a1f01de5716f69d22d27d5a4a055e15178acdb5/header_alt_assets_8.jpg?t=1787104224",
    230410: "https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/230410/a000b4bf98dde5d51cd44206f1ac21d04841017e/header.jpg?t=1786540562",
    1361210: "https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/1361210/f07ebcb73a34112ac61c54608b1f1ded7e45eb8a/header.jpg?t=1782226781",
    3041230: "https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/3041230/7e838d87d787735d5d29d72777c5ee55653dfb2b/header.jpg?t=1783932953",
    20900: "https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/20900/header.jpg?t=1749200362",
    20920: "https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/20920/header.jpg?t=1761657279",
    292030: "https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/292030/97cca1147b256f450331044255b1dbd2d57d609e/header_alt_assets_4.jpg?t=1787688132",
    2379740: "https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/2379740/header.jpg?t=1772694401",
    39210: "https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/39210/header.jpg?t=1782870674",
    582660: "https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/582660/3c4172635738d9e5901e340b28136745fd9e491a/header_alt_assets_27.jpg?t=1786645008",
  });

  function coverUrl(game, alternate) {
    if (game.image) {
      return game.image;
    }

    if (alternate) {
      return `https://cdn.cloudflare.steamstatic.com/steam/apps/${game.appId}/library_600x900.jpg`;
    }

    return currentHeaderImages[game.appId]
      || `https://cdn.cloudflare.steamstatic.com/steam/apps/${game.appId}/header.jpg`;
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

  function isGameUpcoming(game, now) {
    if (!game.releaseDate) return false;

    const dateParts = game.releaseDate.split("-").map(Number);
    if (dateParts.length !== 3 || dateParts.some(Number.isNaN)) return false;

    const releaseStart = new Date(
      dateParts[0],
      dateParts[1] - 1,
      dateParts[2],
    );

    return now < releaseStart;
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
    image.src = coverUrl(game, false);
    image.alt = `${game.title} cover art`;
    image.loading = eager ? "eager" : "lazy";
    image.decoding = "async";
    image.dataset.coverAttempt = game.image ? "external" : "0";

    image.classList.add(game.image ? "console-cover" : "landscape-cover");
    shell.classList.add("has-cover-image");
    shell.style.setProperty(
      "--cover-image",
      `url("${image.src.replace(/\"/g, "%22")}")`,
    );

    image.addEventListener("error", function () {
      if (image.dataset.coverAttempt === "0") {
        image.dataset.coverAttempt = "1";
        image.classList.remove("landscape-cover");
        image.src = coverUrl(game, true);
        return;
      }

      image.remove();
      shell.classList.remove("has-cover-image");
      shell.classList.add("cover-unavailable");
    });

    shell.append(fallback, image);
    return shell;
  }

  function createGameCard(game, index, platform) {
    const upcoming = isGameUpcoming(game, new Date());
    const isPcGame = (platform.id === "pc" || game.sourcePlatformId === "pc") && game.appId;
    const card = document.createElement(isPcGame ? "a" : "article");
    card.className = "game-card";

    if (isPcGame) {
      card.href = `https://store.steampowered.com/app/${game.appId}/`;
      card.target = "_blank";
      card.rel = "noopener noreferrer";
      card.setAttribute("aria-label", `View ${game.title} on Steam`);
    }

    if (upcoming) {
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

    if (upcoming) {
      const release = document.createElement("p");
      release.className = "card-release";
      release.append("Coming ");

      const releaseTime = document.createElement("time");
      releaseTime.dateTime = game.releaseDate;
      releaseTime.textContent = game.releaseLabel || game.releaseDate;
      release.append(releaseTime);
      details.append(release);
    }

    card.append(cover, details);
    return card;
  }

  function renderPlatform(platform) {
    panel.setAttribute("aria-labelledby", `tab-${platform.id}`);
    platformName.textContent = `${platform.label} Library`;

    if (platform.comingSoon) {
      libraryCount.textContent = "Coming Soon";
      grid.hidden = true;
      comingSoon.hidden = false;
      grid.replaceChildren();
      return;
    }

    libraryCount.textContent = `${platform.games.length} Games`;
    grid.hidden = false;
    comingSoon.hidden = true;

    const fragment = document.createDocumentFragment();
    platform.games.forEach((game, index) => {
      fragment.append(createGameCard(game, index, platform));
    });

    grid.replaceChildren(fragment);
  }

  function activatePlatform(id, focusTab) {
    const platform = viewPlatforms.find((entry) => entry.id === id) || viewPlatforms[0];
    if (!platform) return;

    activePlatformId = platform.id;

    tabs.querySelectorAll('[role="tab"]').forEach((tab) => {
      const selected = tab.dataset.platform === activePlatformId;
      tab.classList.toggle("active", selected);
      tab.setAttribute("aria-selected", String(selected));
      tab.tabIndex = selected ? 0 : -1;

      if (selected && focusTab) {
        tab.focus();
      }
    });

    renderPlatform(platform);
  }

  function createTabs() {
    const fragment = document.createDocumentFragment();

    viewPlatforms.forEach((platform, index) => {
      const button = document.createElement("button");
      button.className = "platform-tab";
      button.id = `tab-${platform.id}`;
      button.type = "button";
      button.dataset.platform = platform.id;
      button.setAttribute("role", "tab");
      button.setAttribute("aria-controls", "platform-panel");
      button.setAttribute("aria-selected", String(platform.id === activePlatformId));
      button.tabIndex = platform.id === activePlatformId ? 0 : -1;

      const label = document.createElement("span");
      label.textContent = platform.label;

      const count = document.createElement("span");
      count.className = "tab-count";
      count.textContent = platform.comingSoon ? "Soon" : String(platform.games.length);

      button.append(label, count);
      button.addEventListener("click", () => activatePlatform(platform.id, false));
      button.addEventListener("keydown", (event) => {
        let targetIndex = index;

        if (event.key === "ArrowRight") {
          targetIndex = (index + 1) % viewPlatforms.length;
        } else if (event.key === "ArrowLeft") {
          targetIndex = (index - 1 + viewPlatforms.length) % viewPlatforms.length;
        } else if (event.key === "Home") {
          targetIndex = 0;
        } else if (event.key === "End") {
          targetIndex = viewPlatforms.length - 1;
        } else {
          return;
        }

        event.preventDefault();
        activatePlatform(viewPlatforms[targetIndex].id, true);
      });

      fragment.append(button);
    });

    tabs.replaceChildren(fragment);
  }

  function renderLibrary() {
    if (
      !grid
      || !headerCount
      || !tabs
      || !panel
      || !platformName
      || !libraryCount
      || !comingSoon
      || platforms.length === 0
    ) {
      return;
    }

    const totalGames = library.totalGames
      || platforms.reduce((total, platform) => total + platform.games.length, 0);

    headerCount.textContent = String(totalGames);
    createTabs();
    activatePlatform(activePlatformId, false);
  }

  renderLibrary();
})();
