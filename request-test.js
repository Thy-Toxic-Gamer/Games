(function () {
  "use strict";
  const client = window.toxicSupabase;
  const dialog = document.querySelector("#request-dialog");
  const form = document.querySelector("#request-form");
  const title = document.querySelector("#request-game-title");
  const platform = document.querySelector("#request-game-platform");
  const accountName = document.querySelector("#request-account-name");
  const note = document.querySelector("#request-note");
  const error = document.querySelector("#request-form-error");
  const slotCard = document.querySelector("#request-status-card");
  const slotLabel = document.querySelector("#request-slot-label");
  const slotDetail = document.querySelector("#request-slot-detail");
  const authName = document.querySelector("#request-auth-name");
  const signInButton = document.querySelector("#twitch-sign-in");
  const signOutButton = document.querySelector("#twitch-sign-out");
  const unlistedForm = document.querySelector("#unlisted-request-form");
  const unlistedTitle = document.querySelector("#unlisted-game-title");
  const unlistedButton = document.querySelector("#unlisted-request-button");
  let selected = null;
  let session = null;
  let systemState = { serviceEnabled:true, slotOpen:true, globalCooldownEnds:null, canBypassCooldown:false };

  function prettyPlatform(value) { return ({pc:"PC",switch:"Nintendo Switch",ps5:"PS5",ps4:"PS4",snes:"SNES",unlisted:"Not in Catalog"})[value] || value; }
  function requestLabel(selection) { return selection.requestType === "unlisted" ? "Not in Catalog · $10 Minimum" : `${prettyPlatform(selection.gamePlatform)} · Owned Game · $5 Minimum`; }
  function twitchName(user) {
    const data = user?.user_metadata || {};
    return data.preferred_username || data.user_name || data.login || data.name || data.full_name || "Twitch Viewer";
  }
  function cooldownActive() { return !systemState.canBypassCooldown && systemState.globalCooldownEnds && new Date(systemState.globalCooldownEnds).getTime() > Date.now(); }
  function requestLocked() { return systemState.serviceEnabled === false || !systemState.slotOpen || cooldownActive(); }
  function authRedirect() { return new URL("index.html", window.location.href).href; }
  async function signIn() {
    if (!client) return;
    await client.auth.signInWithOAuth({ provider:"twitch", options:{redirectTo:authRedirect()} });
  }
  async function refreshState() {
    if (!client) return;
    const { data, error:stateError } = await client.rpc("request_system_state");
    if (!stateError && data) systemState = data;
    updateInterface();
  }
  function updateInterface() {
    const signedIn = Boolean(session?.user);
    const locked = requestLocked();
    authName.textContent = signedIn ? twitchName(session.user) : "Not signed in";
    signInButton.hidden = signedIn;
    signOutButton.hidden = !signedIn;
    document.querySelectorAll(".request-game-button").forEach((button) => {
      button.setAttribute("aria-disabled", String(locked));
      button.textContent = systemState.serviceEnabled === false ? "Requests Temporarily Off" : locked ? "Request Slot Unavailable" : signedIn ? "Request for $5+" : "Sign in to Request";
    });
    if (unlistedButton) {
      unlistedButton.disabled = locked;
      unlistedButton.textContent = systemState.serviceEnabled === false ? "Requests Temporarily Off" : locked ? "Request Slot Unavailable" : signedIn ? "Request for $10+" : "Sign in to Request";
    }
    if (unlistedTitle) unlistedTitle.disabled = locked;
    if (systemState.serviceEnabled === false) {
      slotCard.dataset.state = "cooldown"; slotLabel.textContent = "New Requests Temporarily Off";
      slotDetail.textContent = "Staff paused new submissions. Existing requests continue normally.";
    } else if (cooldownActive()) {
      slotCard.dataset.state = "cooldown"; slotLabel.textContent = "14-Day Cooldown";
      slotDetail.textContent = `Requests reopen ${new Date(systemState.globalCooldownEnds).toLocaleString()}, unless staff resets the cooldown early.`;
    } else if (!systemState.slotOpen) {
      slotCard.dataset.state = "locked"; slotLabel.textContent = "Request in Progress";
      slotDetail.textContent = "The single viewer request slot is currently occupied.";
    } else {
      slotCard.dataset.state = "open"; slotLabel.textContent = "Open";
      slotDetail.textContent = signedIn ? "Choose any game below." : "Sign in with Twitch to request a game.";
    }
  }
  async function openRequest(button) {
    if (!session?.user) { await signIn(); return; }
    if (requestLocked()) { updateInterface(); return; }
    selected = {gameTitle:button.dataset.gameTitle,gamePlatform:button.dataset.gamePlatform,requestType:"catalog"};
    title.textContent = selected.gameTitle; platform.textContent = requestLabel(selected);
    accountName.textContent = twitchName(session.user); error.textContent = ""; dialog.showModal(); note.focus();
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
  signInButton?.addEventListener("click", signIn);
  signOutButton?.addEventListener("click", async () => { await client.auth.signOut(); window.location.reload(); });
  unlistedForm?.addEventListener("submit", async (event) => {
    event.preventDefault();
    if (!session?.user) { await signIn(); return; }
    if (requestLocked()) { updateInterface(); return; }
    const gameTitle = unlistedTitle.value.trim();
    if (!gameTitle) return;
    selected = {gameTitle,gamePlatform:"unlisted",requestType:"unlisted"};
    title.textContent = gameTitle; platform.textContent = requestLabel(selected);
    accountName.textContent = twitchName(session.user); error.textContent = ""; dialog.showModal(); note.focus();
  });
  form?.addEventListener("submit", async (event) => {
    event.preventDefault();
    if (!selected || !session?.user) { error.textContent = "Sign in with Twitch before submitting."; return; }
    const payload = {
      viewer_id:session.user.id,
      twitch_name:twitchName(session.user).slice(0,25),
      request_type:selected.requestType,
      game_title:selected.gameTitle,
      platform:prettyPlatform(selected.gamePlatform),
      viewer_note:note.value.trim() || null
    };
    const submitButton = form.querySelector(".request-submit");
    submitButton.disabled = true;
    const { error:insertError } = await client.from("game_requests").insert(payload);
    submitButton.disabled = false;
    if (insertError) {
      error.textContent = insertError.code === "23505" ? "Another request reached the single request slot first. Please try again later." : "The request could not be submitted. Check the request slot or cooldown and try again.";
      await refreshState(); return;
    }
    dialog.close(); form.reset(); selected = null; window.location.href = "status.html";
  });
  async function initialize() {
    if (!client) { slotLabel.textContent = "Connection Error"; slotDetail.textContent = "The request service could not load."; return; }
    const { data } = await client.auth.getSession();
    session = data.session;
    client.auth.onAuthStateChange((_event,nextSession) => { session = nextSession; updateInterface(); });
    await refreshState();
  }
  const observer = new MutationObserver(updateInterface);
  observer.observe(document.querySelector("#game-grid"), {childList:true});
  initialize();
})();
