(function () {
  "use strict";

  const grid = document.querySelector("#game-grid");
  const tabs = document.querySelector("#platform-tabs");
  const panel = document.querySelector("#platform-panel");
  const sectionHeading = panel?.querySelector(".section-heading");

  if (!grid || !tabs || !panel) return;

  const platformMeta = Object.freeze({
    switch: { label: "Nintendo Switch", icon: "◫", limit: 12, accent: "#ff392b" },
    pc: { label: "PC", icon: "▣", limit: 5, accent: "#79b51f" },
    ps5: { label: "PS5", icon: "△", limit: 5, accent: "#159cff" },
    snes: { label: "SNES", icon: "✚", limit: 5, accent: "#d766ff" },
    all: { label: "All", accent: "#7cff00" },
    xbox: { label: "Xbox", accent: "#a2aaa5" },
  });

  let dashboard = null;
  let scheduled = false;
  let hidePopoverTimer = null;

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

    if (platformId === "pc") {
      const image = clone.querySelector(".game-cover");
      const href = clone.getAttribute("href") || "";
      const match = href.match(/\/app\/(\d+)/);

      if (image && match) {
        const original = image.src;
        image.classList.remove("landscape-cover");
        image.classList.add("portrait-cover");
        image.src = `https://cdn.cloudflare.steamstatic.com/steam/apps/${match[1]}/library_600x900.jpg`;
        image.addEventListener("error", function restoreHeader() {
          image.src = original;
          image.classList.remove("portrait-cover");
          image.classList.add("landscape-cover");
        }, { once: true });
      }
    }

    return clone;
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

    cards.slice(0, meta.limit).forEach((card) => {
      cardGrid.append(preparePreviewCard(card, platformId));
    });

    section.append(heading, cardGrid, viewAllButton(platformId, cards.length));
    return section;
  }

  function buildDashboard() {
    const selected = activePlatform();
    panel.dataset.dashboardPlatform = selected;

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
    fragment.append(platformSection("switch", cardsByPlatform.switch, true));

    const lower = document.createElement("div");
    lower.className = "dashboard-lower-grid";
    ["pc", "ps5", "snes"].forEach((id) => {
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
    } else {
      image.removeAttribute("src");
      image.alt = "";
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
    if (card) hidePopoverTimer = setTimeout(hidePopover, 70);
  });

  window.addEventListener("scroll", hidePopover, { passive: true });
  window.addEventListener("resize", hidePopover);

  tabs.addEventListener("click", function () {
    setTimeout(scheduleDashboard, 0);
  });

  tabs.addEventListener("keydown", function () {
    setTimeout(scheduleDashboard, 0);
  });

  const observer = new MutationObserver(scheduleDashboard);
  observer.observe(grid, { childList: true });

  scheduleDashboard();
})();
