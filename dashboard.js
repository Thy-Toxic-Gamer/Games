(function () {
  "use strict";

  const grid = document.querySelector("#game-grid");
  const tabs = document.querySelector("#platform-tabs");
  const panel = document.querySelector("#platform-panel");
  const sectionHeading = panel?.querySelector(".section-heading");
  const comingSoon = document.querySelector("#coming-soon-panel");
  const systems = window.TOXIC_CATALOG?.systems || {};

  if (!grid || !tabs || !panel) return;

  const platformMeta = Object.freeze({
    switch: { label: "Nintendo Games", icon: "◫", limit: 12, accent: systems.switch?.accent || "#E60012" },
    pc: { label: "PC Games", icon: "▣", limit: 12, accent: systems.pc?.accent || "#FFE600" },
    ps5: { label: "PlayStation 5", icon: "△", limit: 4, accent: systems.ps5?.accent || "#2D9CFF" },
    ps4: { label: "PlayStation 4", icon: "△", limit: 5, accent: systems.ps4?.accent || "#006FCD" },
    snes: { label: "Super Nintendo", icon: "✚", limit: 4, accent: systems.snes?.accent || "#9B72CF" },
    nes: { label: "Nintendo Entertainment System", accent: systems.nes?.accent || "#D8D8D8" },
    gb: { label: "Game Boy", accent: systems.gb?.accent || "#9BBC0F" },
    gbc: { label: "Game Boy Color", accent: systems.gbc?.accent || "#A855F7" },
    gba: { label: "Game Boy Advance", accent: systems.gba?.accent || "#7567D9" },
    n64: { label: "Nintendo 64", accent: systems.n64?.accent || "#35C759" },
    gamecube: { label: "Nintendo GameCube", accent: systems.gamecube?.accent || "#6A5ACD" },
    genesis: { label: "Sega Genesis", accent: systems.genesis?.accent || "#2384E8" },
    "virtual-boy": { label: "Virtual Boy", accent: systems["virtual-boy"]?.accent || "#FF3030" },
    all: { label: "All", accent: "#343a36" },
    xbox: { label: "Xbox Games", icon: "◉", limit: 4, accent: systems.xbox?.accent || "#107C10" },
    completed: { label: "Completed Requests", accent: "#ff2bd6" },
    updates: { label: "Updates", accent: "#ffb000" },
  });

  document.querySelectorAll(".updates-id-grid span").forEach((item) => {
    const code = item.querySelector("code")?.textContent?.split("#")[0];
    const systemId = window.TOXIC_CATALOG?.systemIdFor(code);
    const system = systems[systemId];
    if (!system) return;
    item.dataset.system = systemId;
    item.style.setProperty("--system-accent", system.accent);
    item.style.setProperty("--system-ink", system.ink);
  });

  const previewPriority = Object.freeze({
    switch: Object.freeze([
      "FINAL FANTASY",
      "FINAL FANTASY II",
      "FINAL FANTASY III",
      "FINAL FANTASY IV",
      "FINAL FANTASY V",
      "FINAL FANTASY VI",
      "FANTASY LIFE i: The Girl Who Steals Time Nintendo Switch 2 Edition",
      "Atelier Ryza Secret Trilogy Deluxe Pack",
      "Rogue Legacy 2",
      ".hack//G.U. Last Recode",
      "Valthirian Arc: Hero School Story",
      "Sonic Mania",
      "FINAL FANTASY VII",
      "Guardian Tales",
      "Record of Lodoss War-Deedlit in Wonder Labyrinth-",
      "Miden Tower",
    ]),
    pc: Object.freeze([
      "God of War",
      "Clair Obscur: Expedition 33",
      "DOOM Eternal",
      "The Witcher 3: Wild Hunt - Complete Edition",
      "FINAL FANTASY XIV Online",
    ]),
    ps5: Object.freeze([
      "FINAL FANTASY XVI",
      "Horizon Forbidden West",
      "The First Descendant",
      "FINAL FANTASY VII REBIRTH",
      "Resident Evil 4",
    ]),
  });

  const previewRotationInterval = 20000;
  const initialFeaturedTitles = Object.freeze({
    pc: "Castlevania: Belmont\'s Curse",
    ps5: "The First Descendant",
  });

  let dashboard = null;
  let scheduled = false;
  let hidePopoverTimer = null;
  let previewRotationRound = 0;

  const popover = document.createElement("aside");
  popover.className = "game-detail-popover";
  popover.setAttribute("aria-hidden", "true");
  popover.innerHTML = `
    <div class="game-detail-cover"><img alt="" /></div>
    <div class="game-detail-copy">
      <h3></h3>
      <p class="game-detail-platform"></p>
      <span class="game-detail-label">Genre</span>
      <p class="game-detail-genre"></p>
      <span class="game-detail-label">About the game</span>
      <p class="game-detail-story"></p>
    </div>
  `;
  document.body.append(popover);

  function activePlatform() {
    return tabs.querySelector('.platform-tab.active')?.dataset.platform || "all";
  }

  function getCards(platformId) {
    if (platformId === "switch") return Array.from(grid.querySelectorAll('[data-collection-platform="switch"]'));
    if (platformId === "ps5") return Array.from(grid.querySelectorAll('[data-collection-platform="ps5"]'));
    if (platformId === "snes") return Array.from(grid.querySelectorAll('[data-collection-platform="emulation"]'));
    return Array.from(grid.querySelectorAll(`.game-card.platform-${platformId}`));
  }

  function platformFromCard(card) {
    return card.dataset.gameSystemId || Object.keys(platformMeta).find((id) => card.classList.contains(`platform-${id}`)) || activePlatform();
  }

  function preparePreviewCard(card) {
    const clone = card.cloneNode(true);
    clone.classList.add("dashboard-card");
    return clone;
  }

  function shuffleCards(cards) {
    const shuffled = [...cards];

    for (let index = shuffled.length - 1; index > 0; index -= 1) {
      const swapIndex = Math.floor(Math.random() * (index + 1));
      [shuffled[index], shuffled[swapIndex]] = [shuffled[swapIndex], shuffled[index]];
    }

    return shuffled;
  }

  function cardTitle(card) {
    return card.querySelector(".game-details h3")?.textContent?.trim() || "";
  }

  function renderDetailCover(container, sourceCover, title) {
    container.replaceChildren();

    if (!sourceCover) return;

    if (sourceCover.classList.contains("hybrid-sprite-cover")) {
      const sprite = document.createElement("div");
      sprite.className = "hybrid-detail-cover";
      sprite.setAttribute("role", "img");
      sprite.setAttribute("aria-label", `${title} cover art`);
      sprite.style.setProperty(
        "--sprite-image",
        sourceCover.style.getPropertyValue("--sprite-image"),
      );
      sprite.style.setProperty(
        "--sprite-position",
        sourceCover.style.getPropertyValue("--sprite-position"),
      );
      container.append(sprite);
      return;
    }

    const image = document.createElement("img");
    image.src = sourceCover.currentSrc || sourceCover.src;
    image.alt = `${title} cover art`;
    image.classList.toggle(
      "full-cover-art",
      sourceCover.classList.contains("full-cover-art"),
    );
    container.append(image);
  }

  function orderedPreviewCards(platformId, cards) {
    const shuffled = shuffleCards(cards);
    const featuredTitle = previewRotationRound === 0
      ? initialFeaturedTitles[platformId]
      : null;

    if (featuredTitle) {
      const featuredIndex = shuffled.findIndex((card) => cardTitle(card) === featuredTitle);

      if (featuredIndex > 0) {
        const [featuredCard] = shuffled.splice(featuredIndex, 1);
        shuffled.unshift(featuredCard);
      }
    }

    return shuffled;
  }

  function createFeaturedDetail() {
    const detail = document.createElement("aside");
    detail.className = "dashboard-feature-detail";
    detail.setAttribute("aria-live", "polite");
    detail.innerHTML = `
      <button class="featured-detail-close" type="button" aria-label="Close game details">×</button>
      <div class="featured-detail-cover"><img alt="" /></div>
      <div class="featured-detail-copy">
        <h3></h3>
        <p class="featured-detail-edition"></p>
        <span class="featured-detail-label">Genre</span>
        <p class="featured-detail-genre"></p>
        <span class="featured-detail-label">About the game</span>
        <p class="featured-detail-story"></p>
      </div>
    `;

    detail.querySelector(".featured-detail-close").addEventListener("click", function () {
      detail.hidden = true;
      const container = detail.closest(".dashboard-platform") || detail.parentElement;
      container
        ?.querySelectorAll(".dashboard-card.selected")
        .forEach((card) => card.classList.remove("selected"));
    });

    return detail;
  }

  function showFeaturedDetail(detail, card) {
    const title = card.querySelector(".game-details h3")?.textContent?.trim() || "Game";
    const genre = card.querySelector(".game-genre")?.textContent?.trim() || "Game";
    const story = card.querySelector(".game-description")?.textContent?.trim()
      || "Story information is not available.";
    const sourceImage = card.querySelector(".game-cover");
    const pixelRemaster = /^FINAL FANTASY(?: II| III| IV| V| VI)?$/.test(title);

    detail.querySelector("h3").textContent = title;
    detail.querySelector(".featured-detail-edition").textContent = pixelRemaster
      ? `${card.dataset.gameSystemLabel || "Nintendo Switch"} · Pixel Remaster`
      : card.dataset.gameSystemLabel || "Nintendo Switch";
    detail.querySelector(".featured-detail-genre").textContent = genre;
    detail.querySelector(".featured-detail-story").textContent = story;

    renderDetailCover(
      detail.querySelector(".featured-detail-cover"),
      sourceImage,
      title,
    );

    const container = detail.closest(".dashboard-platform") || detail.parentElement;
    container
      ?.querySelectorAll(".dashboard-card")
      .forEach((preview) => preview.classList.toggle("selected", preview === card));

    detail.hidden = false;
    hidePopover();
  }

  function viewAllButton(platformId, count) {
    const meta = platformMeta[platformId];
    const button = document.createElement("button");
    button.className = "dashboard-view-all";
    button.style.setProperty("--panel-accent", meta.accent);
    button.type = "button";
    button.textContent = count > 0
      ? `View all ${count} ${meta.label} ›`
      : `Open ${meta.label} ›`;
    button.addEventListener("click", function () {
      const targetPlatformId = platformId === "snes" ? "emulation" : platformId;
      tabs.querySelector(`[data-platform="${targetPlatformId}"]`)?.click();
      if (platformId === "snes") {
        document.querySelector('[data-section="snes-emulation"]')?.click();
      }
      panel.scrollIntoView({ behavior: "smooth", block: "start" });
    });
    return button;
  }

  function platformSection(platformId, cards, featured) {
    const meta = platformMeta[platformId];
    const section = document.createElement("section");
    section.className = `dashboard-platform dashboard-${platformId}${featured ? " dashboard-featured" : ""}`;

    const heading = document.createElement("div");
    heading.className = "dashboard-platform-heading";
    heading.innerHTML = `
      <div class="dashboard-platform-title">
        <span class="dashboard-platform-icon" aria-hidden="true">${meta.icon}</span>
        <h2>${meta.label}</h2>
        <span class="dashboard-platform-count">${cards.length} Games</span>
      </div>
    `;

    const cardGrid = document.createElement("div");
    cardGrid.className = "dashboard-card-grid";

    const previewCards = orderedPreviewCards(platformId, cards).slice(0, meta.limit).map((card) =>
      preparePreviewCard(card));

    previewCards.forEach((card) => {
      cardGrid.append(card);
    });

    if (!previewCards.length) {
      cardGrid.classList.add("dashboard-card-grid-empty");
      const emptyState = document.createElement("p");
      emptyState.className = "dashboard-empty-state";
      emptyState.textContent = `${meta.label} are coming soon.`;
      cardGrid.append(emptyState);
    }

    // A featured section is only a wider preview grid.
    // Game details are shown consistently by the hover/focus popover for every platform.

    section.append(heading, cardGrid, viewAllButton(platformId, cards.length));
    return section;
  }

  function buildDashboard() {
    const selected = activePlatform();
    const searching = panel.dataset.searchActive === "true";
    panel.dataset.dashboardPlatform = searching ? "search" : selected;

    if (searching) {
      if (dashboard) dashboard.hidden = true;
      grid.hidden = false;
      if (sectionHeading) sectionHeading.hidden = false;
      hidePopover();
      return;
    }

    if (selected === "updates" || selected === "completed") {
      if (dashboard) dashboard.hidden = true;
      grid.hidden = true;
      if (sectionHeading) sectionHeading.hidden = false;
      hidePopover();
      return;
    }

    if (selected !== "all") {
      if (dashboard) dashboard.hidden = true;
      grid.hidden = comingSoon ? !comingSoon.hidden : false;
      if (sectionHeading) sectionHeading.hidden = false;
      hidePopover();
      return;
    }

    const cardsByPlatform = {
      switch: getCards("switch"),
      pc: getCards("pc"),
      ps5: getCards("ps5"),
      xbox: getCards("xbox"),
      snes: getCards("snes"),
    };

    if (!Object.values(cardsByPlatform).some((cards) => cards.length)) return;

    if (!dashboard) {
      dashboard = document.createElement("div");
      dashboard.className = "platform-dashboard";
      grid.before(dashboard);
    }

    const fragment = document.createDocumentFragment();
    fragment.append(platformSection("pc", cardsByPlatform.pc, true));
    fragment.append(platformSection("switch", cardsByPlatform.switch, true));

    const lower = document.createElement("div");
    lower.className = "dashboard-lower-grid";
    ["ps5", "xbox", "snes"].forEach((id) => {
      lower.append(platformSection(id, cardsByPlatform[id], false));
    });
    fragment.append(lower);

    dashboard.replaceChildren(fragment);
    dashboard.hidden = false;
    grid.hidden = true;
    if (sectionHeading) sectionHeading.hidden = true;
  }

  function scheduleDashboard() {
    if (scheduled) return;
    scheduled = true;
    requestAnimationFrame(function () {
      scheduled = false;
      buildDashboard();
    });
  }

  function positionPopover(card) {
    const rect = card.getBoundingClientRect();
    const width = Math.min(440, window.innerWidth - 28);
    const estimatedHeight = 255;
    const gap = 10;

    let left = rect.right + gap;
    if (left + width > window.innerWidth - 14) {
      left = rect.left - width - gap;
    }
    if (left < 14) {
      left = Math.max(14, Math.min(window.innerWidth - width - 14, rect.left + rect.width / 2 - width / 2));
    }

    let top = rect.top + Math.min(28, rect.height * 0.18);
    if (top + estimatedHeight > window.innerHeight - 14) {
      top = Math.max(14, window.innerHeight - estimatedHeight - 14);
    }

    popover.style.left = `${Math.round(left)}px`;
    popover.style.top = `${Math.round(top)}px`;
  }

  function showPopover(card) {
    clearTimeout(hidePopoverTimer);

    const title = card.querySelector(".game-details h3")?.textContent?.trim() || "Game";
    const info = card.querySelector(".game-hover-info");
    const genre = info?.querySelector(".game-genre")?.textContent?.trim() || "Game";
    const story = info?.querySelector(".game-description")?.textContent?.trim() || "Story information is not available.";
    const sourceImage = card.querySelector(".game-cover");
    const platformId = platformFromCard(card);
    const meta = platformMeta[platformId] || platformMeta.all;

    popover.style.setProperty("--detail-accent", meta.accent);
    popover.querySelector("h3").textContent = title;
    popover.querySelector(".game-detail-platform").textContent = card.dataset.gameSystemLabel || meta.label;
    popover.querySelector(".game-detail-genre").textContent = genre;
    popover.querySelector(".game-detail-story").textContent = story;

    renderDetailCover(
      popover.querySelector(".game-detail-cover"),
      sourceImage,
      title,
    );

    positionPopover(card);
    popover.classList.add("visible");
    popover.setAttribute("aria-hidden", "false");
  }

  function hidePopover() {
    popover.classList.remove("visible");
    popover.setAttribute("aria-hidden", "true");
  }

  document.addEventListener("mouseover", function (event) {
    const card = event.target.closest?.(".game-card");
    if (!card) return;
    showPopover(card);
  });

  document.addEventListener("mouseout", function (event) {
    const card = event.target.closest?.(".game-card");
    if (!card) return;
    if (event.relatedTarget && card.contains(event.relatedTarget)) return;
    hidePopoverTimer = setTimeout(hidePopover, 70);
  });

  document.addEventListener("focusin", function (event) {
    const card = event.target.closest?.(".game-card");
    if (card) showPopover(card);
  });

  document.addEventListener("focusout", function (event) {
    const card = event.target.closest?.(".game-card");
    if (card) {
      hidePopoverTimer = setTimeout(hidePopover, 70);
    }
  });

  window.addEventListener("scroll", hidePopover, { passive: true });
  window.addEventListener("resize", hidePopover);

  tabs.addEventListener("click", function () {
    setTimeout(scheduleDashboard, 0);
  });

  tabs.addEventListener("keydown", function () {
    setTimeout(scheduleDashboard, 0);
  });

  function rotateDashboardPreviews() {
    if (document.hidden || activePlatform() !== "all") return;
    if (dashboard?.matches(":hover") || dashboard?.contains(document.activeElement)) return;

    previewRotationRound += 1;
    hidePopover();
    buildDashboard();
  }

  const observer = new MutationObserver(scheduleDashboard);
  observer.observe(grid, { childList: true });

  window.setInterval(rotateDashboardPreviews, previewRotationInterval);
  scheduleDashboard();
})();
