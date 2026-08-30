(function () {
  "use strict";

  const systems = Object.freeze({
    pc: Object.freeze({ code:"PC", label:"PC Games", accent:"#FFE600", ink:"#050706", aliases:["pc","computer"] }),
    ps5: Object.freeze({ code:"PS5", label:"PlayStation 5", accent:"#2D9CFF", ink:"#050706", aliases:["ps5","playstation 5","playstation"] }),
    ps4: Object.freeze({ code:"PS4", label:"PlayStation 4", accent:"#006FCD", ink:"#FFFFFF", aliases:["ps4","playstation 4","playstation"] }),
    switch: Object.freeze({ code:"SW", label:"Nintendo Switch", accent:"#E60012", ink:"#FFFFFF", aliases:["sw","switch","nintendo switch"] }),
    gamecube: Object.freeze({ code:"GC", label:"Nintendo GameCube", accent:"#6A5ACD", ink:"#FFFFFF", aliases:["gc","gamecube","nintendo gamecube"] }),
    gba: Object.freeze({ code:"GBA", label:"Game Boy Advance", accent:"#7567D9", ink:"#FFFFFF", aliases:["gba","game boy advance"] }),
    gb: Object.freeze({ code:"GB", label:"Game Boy", accent:"#9BBC0F", ink:"#050706", aliases:["gb","game boy"] }),
    gbc: Object.freeze({ code:"GBC", label:"Game Boy Color", accent:"#A855F7", ink:"#FFFFFF", aliases:["gbc","game boy color"] }),
    n64: Object.freeze({ code:"N64", label:"Nintendo 64", accent:"#35C759", ink:"#050706", aliases:["n64","nintendo 64"] }),
    nes: Object.freeze({ code:"NES", label:"Nintendo Entertainment System", accent:"#D8D8D8", ink:"#050706", aliases:["nes","nintendo entertainment system"] }),
    snes: Object.freeze({ code:"SNES", label:"Super Nintendo", accent:"#9B72CF", ink:"#050706", aliases:["snes","super nintendo","super nintendo entertainment system"] }),
    xbox: Object.freeze({ code:"XB", label:"Xbox", accent:"#107C10", ink:"#FFFFFF", aliases:["xb","xbox"] }),
    "virtual-boy": Object.freeze({ code:"VB", label:"Virtual Boy", accent:"#FF3030", ink:"#FFFFFF", aliases:["vb","virtual boy"] }),
    genesis: Object.freeze({ code:"SG", label:"Sega Genesis", accent:"#2384E8", ink:"#FFFFFF", aliases:["sg","sega genesis","genesis"] }),
  });

  function normalize(value) {
    return String(value || "")
      .normalize("NFKD")
      .replace(/[\u0300-\u036f]/g, "")
      .trim()
      .toLocaleLowerCase("en");
  }

  function systemIdFor(value) {
    const normalized = normalize(value);
    if (systems[normalized]) return normalized;
    return Object.keys(systems).find((id) => {
      const system = systems[id];
      return normalize(system.code) === normalized
        || normalize(system.label) === normalized
        || system.aliases.some((alias) => normalize(alias) === normalized);
    }) || null;
  }

  const libraryPlatforms = Array.isArray(window.GAME_LIBRARY?.platforms)
    ? window.GAME_LIBRARY.platforms
    : [];
  const sourceGames = libraryPlatforms
    .filter((platform) => !platform.comingSoon)
    .flatMap((platform) => platform.games.map((game) => ({
      ...game,
      sourcePlatformId: systemIdFor(game.sourcePlatformId || platform.id) || game.sourcePlatformId || platform.id,
      collectionPlatformId: platform.id,
    })));

  const uniqueGames = new Map();
  sourceGames.forEach((game) => {
    const systemId = systemIdFor(game.sourcePlatformId);
    if (!systemId) return;
    const key = `${systemId}::${normalize(game.title)}`;
    if (!uniqueGames.has(key)) uniqueGames.set(key, { ...game, systemId });
  });

  const metadataByKey = new Map();
  Object.keys(systems).forEach((systemId) => {
    const system = systems[systemId];
    const games = [...uniqueGames.values()]
      .filter((game) => game.systemId === systemId)
      .sort((left, right) => left.title.localeCompare(right.title, "en", { numeric:true, sensitivity:"base" }));
    games.forEach((game, index) => {
      const number = String(index + 1).padStart(3, "0");
      metadataByKey.set(`${systemId}::${normalize(game.title)}`, Object.freeze({
        systemId,
        systemCode: system.code,
        systemLabel: system.label,
        catalogId: `${system.code}#${number}`,
        number,
      }));
    });
  });

  const entries = Object.freeze([...uniqueGames.values()].map((game) => {
    const metadata = metadataByKey.get(`${game.systemId}::${normalize(game.title)}`);
    return Object.freeze({ ...game, ...metadata });
  }).sort((left, right) => left.title.localeCompare(right.title, "en", { numeric:true, sensitivity:"base" })));

  function metadataFor(game, fallbackPlatformId) {
    const systemId = systemIdFor(game?.sourcePlatformId || fallbackPlatformId) || "pc";
    return metadataByKey.get(`${systemId}::${normalize(game?.title)}`) || Object.freeze({
      systemId,
      systemCode: systems[systemId]?.code || String(systemId).toUpperCase(),
      systemLabel: systems[systemId]?.label || String(systemId),
      catalogId: `${systems[systemId]?.code || String(systemId).toUpperCase()}#${String(game?.number || 1).padStart(3, "0")}`,
      number: String(game?.number || 1).padStart(3, "0"),
    });
  }

  function search(query, limit = Number.POSITIVE_INFINITY) {
    const normalizedQuery = normalize(query);
    if (!normalizedQuery) return [];
    const matchingSystemIds = Object.keys(systems).filter((id) => {
      const system = systems[id];
      return [system.code, system.label, ...system.aliases].some((value) => normalize(value) === normalizedQuery);
    });
    const terms = normalizedQuery.split(/\s+/).filter(Boolean);
    return entries.filter((entry) => {
      if (matchingSystemIds.length) return matchingSystemIds.includes(entry.systemId);
      const corpus = normalize(`${entry.title} ${entry.catalogId} #${entry.number} ${entry.systemCode} ${entry.systemLabel}`);
      return terms.every((term) => corpus.includes(term));
    }).slice(0, limit);
  }

  function findExact(title, systemValue) {
    const normalizedTitle = normalize(title);
    const requestedSystemId = systemIdFor(systemValue);
    return entries.find((entry) => normalize(entry.title) === normalizedTitle
      && (!requestedSystemId || entry.systemId === requestedSystemId)) || null;
  }

  let autocompleteCounter = 0;
  function enhanceOwnedGameInput({ titleInput, platformInput, errorElement = null }) {
    if (!titleInput || !platformInput) return null;
    autocompleteCounter += 1;
    const listId = `catalog-suggestions-${autocompleteCounter}`;
    const host = titleInput.parentElement;
    host.classList.add("catalog-autocomplete");
    titleInput.setAttribute("autocomplete", "off");
    titleInput.setAttribute("role", "combobox");
    titleInput.setAttribute("aria-autocomplete", "list");
    titleInput.setAttribute("aria-controls", listId);
    titleInput.setAttribute("aria-expanded", "false");
    platformInput.readOnly = true;
    platformInput.placeholder = "Select an owned catalog game";

    const list = document.createElement("div");
    list.id = listId;
    list.className = "catalog-suggestions";
    list.setAttribute("role", "listbox");
    list.hidden = true;
    host.append(list);
    let matches = [];
    let activeIndex = -1;
    let enabled = true;

    function clearSelection() {
      delete titleInput.dataset.catalogId;
      delete titleInput.dataset.catalogSystem;
      delete titleInput.dataset.catalogTitle;
      delete platformInput.dataset.catalogSystem;
      titleInput.style.removeProperty("--catalog-system-accent");
      platformInput.style.removeProperty("--catalog-system-accent");
    }
    function close() {
      list.hidden = true;
      activeIndex = -1;
      titleInput.setAttribute("aria-expanded", "false");
      titleInput.removeAttribute("aria-activedescendant");
    }
    function choose(entry) {
      const system = systems[entry.systemId];
      titleInput.value = entry.title;
      titleInput.dataset.catalogId = entry.catalogId;
      titleInput.dataset.catalogSystem = entry.systemId;
      titleInput.dataset.catalogTitle = entry.title;
      platformInput.value = entry.systemLabel;
      platformInput.dataset.catalogSystem = entry.systemId;
      titleInput.style.setProperty("--catalog-system-accent", system?.accent || "#FF2BD6");
      platformInput.style.setProperty("--catalog-system-accent", system?.accent || "#FF2BD6");
      if (errorElement) errorElement.textContent = "";
      close();
      titleInput.dispatchEvent(new Event("change", { bubbles:true }));
    }
    function setActive(index) {
      if (!matches.length) return;
      activeIndex = (index + matches.length) % matches.length;
      list.querySelectorAll("button").forEach((button, buttonIndex) => {
        const active = buttonIndex === activeIndex;
        button.classList.toggle("active", active);
        button.setAttribute("aria-selected", String(active));
        if (active) titleInput.setAttribute("aria-activedescendant", button.id);
      });
    }
    function render() {
      if (!enabled) { close(); return; }
      const query = titleInput.value.trim();
      clearSelection();
      if (!query) { close(); list.replaceChildren(); return; }
      matches = search(query, 10);
      list.replaceChildren();
      matches.forEach((entry, index) => {
        const system = systems[entry.systemId];
        const option = document.createElement("button");
        option.id = `${listId}-option-${index}`;
        option.type = "button";
        option.dataset.system = entry.systemId;
        option.style.setProperty("--catalog-system-accent", system?.accent || "#FF2BD6");
        option.style.setProperty("--catalog-system-ink", system?.ink || "#050706");
        option.setAttribute("role", "option");
        option.innerHTML = `<strong>${entry.catalogId}</strong><span>${entry.title}</span><small>${entry.systemLabel}</small>`;
        option.addEventListener("mousedown", (event) => event.preventDefault());
        option.addEventListener("click", () => choose(entry));
        list.append(option);
      });
      const empty = document.createElement("p");
      if (!matches.length) { empty.textContent = "No owned catalog games match this search."; list.append(empty); }
      list.hidden = false;
      titleInput.setAttribute("aria-expanded", "true");
      activeIndex = -1;
    }

    titleInput.addEventListener("input", render);
    titleInput.addEventListener("focus", () => { if (enabled && titleInput.value.trim() && !titleInput.dataset.catalogId) render(); });
    titleInput.addEventListener("blur", () => window.setTimeout(close, 120));
    titleInput.addEventListener("keydown", (event) => {
      if (event.key === "ArrowDown") { event.preventDefault(); if (list.hidden) render(); setActive(activeIndex + 1); }
      else if (event.key === "ArrowUp") { event.preventDefault(); setActive(activeIndex - 1); }
      else if (event.key === "Enter" && activeIndex >= 0) { event.preventDefault(); choose(matches[activeIndex]); }
      else if (event.key === "Escape") close();
    });

    return Object.freeze({
      selected() {
        if (!enabled) return null;
        if (titleInput.dataset.catalogId && titleInput.value === titleInput.dataset.catalogTitle) {
          return findExact(titleInput.value, titleInput.dataset.catalogSystem);
        }
        return findExact(titleInput.value, platformInput.value);
      },
      select(entry) { if (entry) choose(entry); },
      reset() { clearSelection(); close(); },
      setEnabled(nextEnabled) {
        enabled = Boolean(nextEnabled);
        clearSelection();
        close();
        platformInput.readOnly = enabled;
        platformInput.placeholder = enabled ? "Select an owned catalog game" : "Enter the console or system";
        titleInput.setAttribute("aria-autocomplete", enabled ? "list" : "none");
      },
    });
  }

  window.TOXIC_CATALOG = Object.freeze({ systems, entries, normalize, systemIdFor, metadataFor, search, findExact, enhanceOwnedGameInput });
})();
