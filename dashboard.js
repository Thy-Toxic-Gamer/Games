(function () {
  "use strict";

  const grid = document.querySelector("#game-grid");
  const tabs = document.querySelector("#platform-tabs");
  const panel = document.querySelector("#platform-panel");
  const sectionHeading = panel?.querySelector(".section-heading");

  if (!grid || !tabs || !panel) return;

  const platformMeta = Object.freeze({
    switch: { label: "Nintendo Switch", icon: "◫", limit: 5, accent: "#ff392b" },
    pc: { label: "PC", icon: "▣", limit: 12, accent: "#ffe600" },
    ps5: { label: "PS5", icon: "△", limit: 5, accent: "#159cff" },
    snes: { label: "SNES Emulation", icon: "✚", limit: 2, accent: "#d766ff" },
    all: { label: "All", accent: "#343a36" },
    nes: { label: "NES Emulation", accent: "#f5f5f5" },
    xbox: { label: "Xbox", accent: "#0d7a2f" },
    updates: { label: "Updates", accent: "#ffb000" },
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
    return Array.from(grid.querySelectorAll(`.game-card.platform-${platformId}`));
  }

  function platformFromCard(card) {
    return Object.keys(platformMeta).find((id) => card.classList.contains(`platform-${id}`)) || activePlatform();
  }

  function preparePreviewCard(card, platformId) {
    const clone = card.cloneNode(true);
    clone.classList.add("dashboard-card");

    const details = clone.querySelector(".game-details");
    const genre = clone.querySelector(".game-genre")?.textContent?.trim() || "Game";

    if (details && !["pc", "snes"].includes(platformId)) {
      const metadata = document.createElement("div");
      metadata.className = "dashboard-card-meta";

      const category = document.createElement("span");
      category.className = "dashboard-card-category";
      category.textContent = genre;
      metadata.append(category);
      details.append(metadata);
    }

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
      ? "Pixel Remaster"
      : "Nintendo Switch";
    detail.querySelector(".featured-detail-genre").textContent = genre;
    detail.querySelector(".featured-detail-story").textContent = story;

    const image = detail.querySelector("img");
    if (sourceImage) {
      image.src = sourceImage.currentSrc || sourceImage.src;
      image.alt = `${title} cover art`;
    } else {
      image.removeAttribute("src");
      image.alt = "";
    }

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
    button.textContent = `View all ${count} ${meta.label} games ›`;
    button.addEventListener("click", function () {
      tabs.querySelector(`[data-platform="${platformId}"]`)?.click();
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
        <h2>${meta.label} Library</h2>
        <span class="dashboard-platform-count">${cards.length} Games</span>
      </div>
    `;

    const cardGrid = document.createElement("div");
    cardGrid.className = "dashboard-card-grid";

    const previewCards = orderedPreviewCards(platformId, cards).slice(0, meta.limit).map((card) =>
      preparePreviewCard(card, platformId));

    previewCards.forEach((card) => {
      cardGrid.append(card);
    });

    // A featured section is only a wider preview grid.
    // Game details are shown consistently by the hover/focus popover for every platform.

    section.append(heading, cardGrid, viewAllButton(platformId, cards.length));
    return section;
  }

  function buildDashboard() {
    const selected = activePlatform();
    panel.dataset.dashboardPlatform = selected;

    if (selected === "updates") {
      if (dashboard) dashboard.hidden = true;
      grid.hidden = true;
      if (sectionHeading) sectionHeading.hidden = false;
      hidePopover();
      return;
    }

    if (selected !== "all") {
      if (dashboard) dashboard.hidden = true;
      grid.hidden = false;
      if (sectionHeading) sectionHeading.hidden = false;
      hidePopover();
      return;
    }

    const cardsByPlatform = {
      switch: getCards("switch"),
      pc: getCards("pc"),
      ps5: getCards("ps5"),
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

    const lower = document.createElement("div");
    lower.className = "dashboard-lower-grid";
    ["switch", "ps5", "snes"].forEach((id) => {
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
    popover.querySelector(".game-detail-platform").textContent = meta.label;
    popover.querySelector(".game-detail-genre").textContent = genre;
    popover.querySelector(".game-detail-story").textContent = story;

    const image = popover.querySelector("img");
    if (sourceImage) {
      image.src = sourceImage.currentSrc || sourceImage.src;
      image.alt = `${title} cover art`;
      image.classList.toggle("full-cover-art", sourceImage.classList.contains("full-cover-art"));
    } else {
      image.removeAttribute("src");
      image.alt = "";
      image.classList.remove("full-cover-art");
    }

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
