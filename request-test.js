(function () {
  "use strict";
  const STORAGE_KEY = "toxicGameRequestTestV1";
  const dialog = document.querySelector("#request-dialog");
  const form = document.querySelector("#request-form");
  const title = document.querySelector("#request-game-title");
  const platform = document.querySelector("#request-game-platform");
  const userName = document.querySelector("#request-twitch-name");
  const note = document.querySelector("#request-note");
  const error = document.querySelector("#request-form-error");
  const slotCard = document.querySelector("#request-status-card");
  const slotLabel = document.querySelector("#request-slot-label");
  const slotDetail = document.querySelector("#request-slot-detail");
  const unlistedForm = document.querySelector("#unlisted-request-form");
  const unlistedTitle = document.querySelector("#unlisted-game-title");
  const unlistedButton = document.querySelector("#unlisted-request-button");
  let selected = null;

  function readRequest() { try { return JSON.parse(localStorage.getItem(STORAGE_KEY)) || null; } catch { return null; } }
  function saveRequest(request) { localStorage.setItem(STORAGE_KEY, JSON.stringify(request)); window.dispatchEvent(new Event("toxic-request-updated")); }
  function isCooldownActive(request) { return request?.status === "approved" && new Date(request.cooldownEnds).getTime() > Date.now(); }
  function isLocked(request) { return request && ["pending", "awaiting_payment"].includes(request.status) || isCooldownActive(request); }
  function prettyPlatform(value) { return ({pc:"PC",switch:"Nintendo Switch",ps5:"PS5",snes:"SNES",unlisted:"Unlisted Game · Higher Request Price"})[value] || value; }
  function updateSlot() {
    const request = readRequest();
    const locked = isLocked(request);
    document.querySelectorAll(".request-game-button").forEach((button) => {
      button.setAttribute("aria-disabled", String(locked));
      button.textContent = locked ? "Request Slot Unavailable" : "Request This Game";
    });
    if (unlistedButton) { unlistedButton.disabled = locked; unlistedButton.textContent = locked ? "Request Slot Unavailable" : "Request Unlisted Game"; }
    if (unlistedTitle) unlistedTitle.disabled = locked;
    if (!request || (!locked && ["denied", "expired"].includes(request.status))) {
      slotCard.dataset.state = "open"; slotLabel.textContent = "Open"; slotDetail.textContent = "Choose any game below."; return;
    }
    if (isCooldownActive(request)) {
      slotCard.dataset.state = "cooldown"; slotLabel.textContent = "14-Day Cooldown"; slotDetail.textContent = `Reopens ${new Date(request.cooldownEnds).toLocaleString()}.`; return;
    }
    slotCard.dataset.state = "locked";
    slotLabel.textContent = request.status === "pending" ? "Waiting for Review" : request.status === "awaiting_payment" ? "Awaiting Test Payment" : "Open";
    slotDetail.textContent = request.gameTitle || "One request is currently active.";
  }
  function openRequest(button) {
    if (isLocked(readRequest())) { updateSlot(); return; }
    selected = { gameTitle: button.dataset.gameTitle, gamePlatform: button.dataset.gamePlatform, requestType:"catalog" };
    title.textContent = selected.gameTitle; platform.textContent = prettyPlatform(selected.gamePlatform); error.textContent = ""; dialog.showModal(); userName.focus();
  }
  document.addEventListener("click", (event) => {
    const button = event.target.closest?.(".request-game-button");
    if (!button) return;
    event.preventDefault(); event.stopPropagation(); openRequest(button);
  });
  document.addEventListener("keydown", (event) => {
    const button = event.target.closest?.('.request-game-button[role="button"]');
    if (button && (event.key === "Enter" || event.key === " ")) { event.preventDefault(); openRequest(button); }
  });
  document.querySelector(".request-dialog-close")?.addEventListener("click", () => dialog.close());
  unlistedForm?.addEventListener("submit", (event) => {
    event.preventDefault();
    if (isLocked(readRequest())) { updateSlot(); return; }
    const gameTitle = unlistedTitle.value.trim();
    if (!gameTitle) return;
    selected = { gameTitle, gamePlatform:"unlisted", requestType:"unlisted" };
    title.textContent = gameTitle; platform.textContent = prettyPlatform("unlisted"); error.textContent = ""; dialog.showModal(); userName.focus();
  });
  form?.addEventListener("submit", (event) => {
    event.preventDefault();
    if (!selected || !userName.value.trim()) { error.textContent = "Enter a Twitch username for this test."; return; }
    if (isLocked(readRequest())) { error.textContent = "The viewer request slot is already locked."; updateSlot(); return; }
    const request = { id:`GR-${Date.now().toString().slice(-6)}`, status:"pending", requestType:selected.requestType || "catalog", gameTitle:selected.gameTitle, platform:prettyPlatform(selected.gamePlatform), twitchName:userName.value.trim(), note:note.value.trim(), createdAt:new Date().toISOString() };
    saveRequest(request); dialog.close(); form.reset(); selected = null; updateSlot(); window.location.href = "status.html";
  });
  window.addEventListener("storage", updateSlot); window.addEventListener("toxic-request-updated", updateSlot);
  const observer = new MutationObserver(updateSlot); observer.observe(document.querySelector("#game-grid"), {childList:true});
  updateSlot();
})();
