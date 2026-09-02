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
  const publicSignals = document.querySelector("#request-public-signals");
  const openSignal = document.querySelector("#request-signal-open");
  const blockedSignal = document.querySelector("#request-signal-blocked");
  const cooldownSignal = document.querySelector("#request-signal-cooldown");
  const openSignalState = document.querySelector("#request-signal-open-state");
  const blockedSignalState = document.querySelector("#request-signal-blocked-state");
  const cooldownSignalState = document.querySelector("#request-signal-cooldown-state");
  const breakPanel = document.querySelector("#request-break-panel");
  const breakCountdown = document.querySelector("#request-break-countdown");
  const breakReopens = document.querySelector("#request-break-reopens");
  const nextRequestPanel = document.querySelector("#next-request-panel");
  const nextRequestGame = document.querySelector("#next-request-game");
  const nextRequestPlatform = document.querySelector("#next-request-platform");
  const nextRequestType = document.querySelector("#next-request-type");
  const nextRequestSchedule = document.querySelector("#next-request-schedule");
  const nextRequestStatus = document.querySelector("#next-request-status");
  const nextRequestYear = document.querySelector("#next-request-year");
  const nextRequestSummary = document.querySelector("#next-request-summary");
  const authName = document.querySelector("#request-auth-name");
  const ownerTestNotice = document.querySelector("#owner-test-notice");
  const requestDialogRules = document.querySelector("#request-dialog-rules");
  const requestSubmitButton = document.querySelector("#request-submit-button");
  const signInButton = document.querySelector("#twitch-sign-in");
  const signOutButton = document.querySelector("#twitch-sign-out");
  const unlistedForm = document.querySelector("#unlisted-request-form");
  const unlistedTitle = document.querySelector("#unlisted-game-title");
  const unlistedButton = document.querySelector("#unlisted-request-button");
  const requestChoiceTabs = Array.from(document.querySelectorAll(".request-choice-tab"));
  const requestChoices = Object.freeze({
    catalog: Object.freeze({
      play: Object.freeze({ label:"Play Game", amount:5 }),
      speed_run: Object.freeze({ label:"Speed Run Game", amount:10 }),
      completion: Object.freeze({ label:"100% Completion", amount:15 }),
    }),
    unlisted: Object.freeze({
      play: Object.freeze({ label:"Play Game", amount:10 }),
      speed_run: Object.freeze({ label:"Speed Run Game", amount:15 }),
      completion: Object.freeze({ label:"100% Completion", amount:20 }),
    }),
  });
  let selected = null;
  let session = null;
  let ownerTestMode = false;
  let systemState = { serviceEnabled:true, slotOpen:true, globalCooldownEnds:null, cooldownKind:null, canBypassCooldown:false };
  let breakWasActive = false;

  function prettyPlatform(value) {
    if (value === "unlisted") return "Not in Catalog";
    const catalog = window.TOXIC_CATALOG;
    const systemId = catalog?.systemIdFor(value);
    return catalog?.systems?.[systemId]?.label || ({pc:"PC Games",switch:"Nintendo Switch",ps5:"PlayStation 5",ps4:"PlayStation 4",snes:"Super Nintendo"})[value] || value;
  }
  function requestLabel(selection) { return selection.requestType === "unlisted" ? "Not in Catalog" : `${prettyPlatform(selection.gamePlatform)} · Owned Catalog Game`; }
  function requestGoalLabel(goal) {
    return ({play:"Play Game",speed_run:"Speed Run Game",completion:"100% Completion"})[goal] || "Play Game";
  }
  function formatEasternSchedule(value) {
    const date = new Date(value);
    if (!Number.isFinite(date.getTime())) return "Schedule pending";
    return new Intl.DateTimeFormat("en-US", {
      timeZone:"America/New_York",
      weekday:"long",
      month:"long",
      day:"numeric",
      year:"numeric",
      hour:"numeric",
      minute:"2-digit",
      timeZoneName:"short"
    }).format(date);
  }
  function catalogSummary(gameTitle) {
    return window.GAME_SUMMARIES?.[gameTitle] || "";
  }
  function catalogReleaseYear(gameTitle) {
    const suffix=`::${gameTitle}`;
    const match=Object.entries(window.GAME_RELEASE_YEARS||{}).find(([key])=>key.endsWith(suffix));
    return match?.[1] || "";
  }
  function renderNextRequest(data) {
    if (!nextRequestPanel) return;
    const scheduled=Boolean(data?.gameTitle&&data?.scheduledFor);
    nextRequestPanel.classList.toggle("has-scheduled-game",scheduled);
    nextRequestStatus.textContent=scheduled?"Coming Up":"No Game Scheduled";
    if (!scheduled) {
      nextRequestGame.textContent="No game is currently scheduled";
      nextRequestPlatform.textContent="A game will appear here after staff records an agreed stream date.";
      nextRequestType.textContent="—";
      nextRequestSchedule.textContent="To be announced";
      nextRequestSchedule.removeAttribute("datetime");
      nextRequestYear.textContent="—";
      nextRequestSummary.textContent="There is no scheduled viewer-requested game right now. Check back after the next paid and approved request is scheduled.";
      nextRequestPanel.hidden=false;
      return;
    }
    nextRequestGame.textContent=data.gameTitle;
    nextRequestPlatform.textContent=data.platform||"System to be confirmed";
    nextRequestType.textContent=requestGoalLabel(data.requestGoal);
    nextRequestSchedule.textContent=formatEasternSchedule(data.scheduledFor);
    nextRequestSchedule.dateTime=data.scheduledFor;
    nextRequestYear.textContent=String(data.releaseYear||catalogReleaseYear(data.gameTitle)||"Year to be confirmed");
    nextRequestSummary.textContent=data.gameSummary||catalogSummary(data.gameTitle)||"A public game summary will be added before the scheduled stream.";
    nextRequestPanel.hidden=false;
  }
  async function refreshNextRequest() {
    if (!client||!nextRequestPanel) return;
    const {data,error:nextRequestError}=await client.rpc("next_public_game_request");
    if(nextRequestError){renderNextRequest(null);return;}
    renderNextRequest(data);
  }
  function selectRequestGoal(goal, focusTab=false) {
    if (!selected) return;
    const choices = requestChoices[selected.requestType];
    const nextGoal = choices[goal] ? goal : "play";
    selected.requestGoal = nextGoal;
    requestChoiceTabs.forEach((tab) => {
      const tabGoal = tab.dataset.requestGoal;
      const choice = choices[tabGoal];
      const active = tabGoal === nextGoal;
      tab.querySelector("[data-choice-price]").textContent = ownerTestMode ? "$0 · Owner Test" : "$"+choice.amount;
      tab.classList.toggle("active", active);
      tab.setAttribute("aria-selected", String(active));
      tab.tabIndex = active ? 0 : -1;
      if (active && focusTab) tab.focus();
    });
  }
  function prepareRequest(selection) {
    selected = { ...selection, requestGoal:"play" };
    title.textContent = selected.gameTitle;
    platform.textContent = requestLabel(selected);
    accountName.textContent = twitchName(session.user);
    error.textContent = "";
    ownerTestNotice.hidden=!ownerTestMode;
    requestDialogRules.textContent=ownerTestMode
      ? "This owner-only test reserves the active request slot and immediately simulates an approved-and-paid request. No payment transaction is created."
      : "Submitting reserves the only viewer request slot while the request is reviewed. No payment is requested until the request is approved.";
    requestSubmitButton.textContent=ownerTestMode?"Submit Free Owner Test":"Submit Game Request";
    selectRequestGoal("play");
    dialog.showModal();
    requestChoiceTabs[0]?.focus();
  }
  function twitchName(user) {
    const data = user?.user_metadata || {};
    return data.preferred_username || data.user_name || data.login || data.name || data.full_name || "Twitch Viewer";
  }
  function cooldownActive() { return !systemState.canBypassCooldown && systemState.globalCooldownEnds && new Date(systemState.globalCooldownEnds).getTime() > Date.now(); }
  function scheduledBreakActive() {
    return systemState.cooldownKind === "break"
      && systemState.globalCooldownEnds
      && new Date(systemState.globalCooldownEnds).getTime() > Date.now();
  }
  function formatBreakCountdown(milliseconds) {
    const totalSeconds = Math.max(0, Math.ceil(milliseconds / 1000));
    const days = Math.floor(totalSeconds / 86400);
    const hours = Math.floor((totalSeconds % 86400) / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    const clock = String(hours).padStart(2,"0") + "h " + String(minutes).padStart(2,"0") + "m " + String(seconds).padStart(2,"0") + "s";
    return days ? days + "d " + clock : clock;
  }
  function renderBreakNotice() {
    const active = Boolean(scheduledBreakActive());
    if (!breakPanel) return active;
    breakPanel.hidden = !active;
    if (active) {
      const deadline = new Date(systemState.globalCooldownEnds);
      breakCountdown.textContent = formatBreakCountdown(deadline.getTime() - Date.now());
      breakReopens.textContent = formatEasternSchedule(deadline);
      breakReopens.dateTime = deadline.toISOString();
    }
    breakWasActive = active;
    return active;
  }
  function requestLocked() { return ownerTestMode ? !systemState.slotOpen : systemState.serviceEnabled === false || !systemState.slotOpen || cooldownActive(); }
  function authRedirect() { return new URL("index.html", window.location.href).href; }
  async function signIn() {
    if (!client) return;
    await client.auth.signInWithOAuth({ provider:"twitch", options:{redirectTo:authRedirect()} });
  }
  async function refreshOwnerAccess() {
    ownerTestMode=false;
    if(!client||!session?.user)return;
    const {data,error:accessError}=await client.rpc("my_request_staff_access");
    ownerTestMode=!accessError&&data?.role==="owner"&&data?.canReview===true;
  }
  async function refreshState() {
    if (!client) return;
    const [{ data, error:stateError }] = await Promise.all([
      client.rpc("request_system_state"),
      refreshNextRequest()
    ]);
    if (!stateError && data) systemState = data;
    updateInterface();
  }
  function updateInterface() {
    const signedIn = Boolean(session?.user);
    const locked = requestLocked();
    const publicCooldown = Boolean(
      systemState.globalCooldownEnds
      && new Date(systemState.globalCooldownEnds).getTime() > Date.now()
    );
    const publicOpen = systemState.serviceEnabled !== false && systemState.slotOpen && !publicCooldown;
    const isScheduledBreak = scheduledBreakActive();
    renderBreakNotice();
    slotCard.classList.toggle("show-owner-signals",ownerTestMode);
    if (publicSignals) {
      publicSignals.hidden = !ownerTestMode;
      openSignal.dataset.active = String(publicOpen);
      blockedSignal.dataset.active = String(!publicOpen);
      cooldownSignal.dataset.active = String(publicCooldown);
      openSignalState.textContent = publicOpen ? "On" : "Off";
      blockedSignalState.textContent = publicOpen ? "Open" : "Closed";
      cooldownSignalState.textContent = publicCooldown ? "Active" : "Off";
    }
    authName.textContent = signedIn ? twitchName(session.user) : "Not signed in";
    signInButton.hidden = signedIn;
    signOutButton.hidden = !signedIn;
    document.querySelectorAll(".request-game-button").forEach((button) => {
      button.setAttribute("aria-disabled", String(locked));
      button.textContent = locked ? "Request Slot Unavailable" : ownerTestMode ? "Request Free Test" : systemState.serviceEnabled === false ? "Requests Temporarily Off" : signedIn ? "Request Game" : "Sign in to Request";
    });
    if (unlistedButton) {
      unlistedButton.disabled = locked;
      unlistedButton.textContent = locked ? "Request Slot Unavailable" : ownerTestMode ? "Choose Free Test" : systemState.serviceEnabled === false ? "Requests Temporarily Off" : signedIn ? "Choose Request Type" : "Sign in to Request";
    }
    if (unlistedTitle) unlistedTitle.disabled = locked;
    if (ownerTestMode && systemState.slotOpen) {
      slotCard.dataset.state = "open"; slotLabel.textContent = "Owner Test Mode";
      slotDetail.textContent = "Submit any owned or unlisted game for $0 to test the real paid-request workflow.";
    } else if (systemState.serviceEnabled === false) {
      slotCard.dataset.state = "cooldown"; slotLabel.textContent = "New Requests Temporarily Off";
      slotDetail.textContent = "Staff paused new submissions.";
    } else if (cooldownActive()) {
      slotCard.dataset.state = "cooldown";
      slotLabel.textContent = isScheduledBreak ? "⁅𝐓𝐡𝐲𝐓☣︎𝐱𝐢𝐜𝐆𝐚𝐦𝐞𝐫⁆ Is Taking a Break" : "14-Day Cooldown";
      slotDetail.textContent = isScheduledBreak
        ? "Requests reopen in " + formatBreakCountdown(new Date(systemState.globalCooldownEnds).getTime() - Date.now()) + "."
        : "Requests reopen " + new Date(systemState.globalCooldownEnds).toLocaleString() + ", unless staff resets the cooldown early.";
    } else if (!systemState.slotOpen) {
      slotCard.dataset.state = "locked"; slotLabel.textContent = "Request in Progress";
      slotDetail.textContent = "The single viewer request slot is currently occupied.";
    } else {
      slotCard.dataset.state = "open"; slotLabel.textContent = "Open";
      slotDetail.textContent = ownerTestMode ? "Owner testing is available for owned or unlisted games at $0." : signedIn ? "Choose any game below." : "Sign in with Twitch to request a game.";
    }
  }
  async function openRequest(button) {
    if (!session?.user) { await signIn(); return; }
    if (requestLocked()) { updateInterface(); return; }
    prepareRequest({gameTitle:button.dataset.gameTitle,gamePlatform:button.dataset.gamePlatform,requestType:"catalog"});
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
  requestChoiceTabs.forEach((tab, index) => {
    tab.addEventListener("click", () => selectRequestGoal(tab.dataset.requestGoal));
    tab.addEventListener("keydown", (event) => {
      let targetIndex = index;
      if (event.key === "ArrowRight") targetIndex = (index + 1) % requestChoiceTabs.length;
      else if (event.key === "ArrowLeft") targetIndex = (index - 1 + requestChoiceTabs.length) % requestChoiceTabs.length;
      else if (event.key === "Home") targetIndex = 0;
      else if (event.key === "End") targetIndex = requestChoiceTabs.length - 1;
      else return;
      event.preventDefault();
      selectRequestGoal(requestChoiceTabs[targetIndex].dataset.requestGoal, true);
    });
  });
  signInButton?.addEventListener("click", signIn);
  signOutButton?.addEventListener("click", async () => { await client.auth.signOut(); window.location.reload(); });
  unlistedForm?.addEventListener("submit", async (event) => {
    event.preventDefault();
    if (!session?.user) { await signIn(); return; }
    if (requestLocked()) { updateInterface(); return; }
    const gameTitle = unlistedTitle.value.trim();
    if (!gameTitle) return;
    prepareRequest({gameTitle,gamePlatform:"unlisted",requestType:"unlisted"});
  });
  form?.addEventListener("submit", async (event) => {
    event.preventDefault();
    if (!selected || !session?.user) { error.textContent = "Sign in with Twitch before submitting."; return; }
    const payload = {
      viewer_id:session.user.id,
      twitch_name:twitchName(session.user).slice(0,25),
      request_type:selected.requestType,
      request_goal:selected.requestGoal,
      game_title:selected.gameTitle,
      platform:prettyPlatform(selected.gamePlatform),
      viewer_note:note.value.trim() || null
    };
    const submitButton = form.querySelector(".request-submit");
    submitButton.disabled = true;
    const result = ownerTestMode
      ? await client.rpc("owner_submit_test_game_request",{
          request_type_text:payload.request_type,
          request_goal_text:payload.request_goal,
          game_title_text:payload.game_title,
          platform_text:payload.platform,
          viewer_note_text:payload.viewer_note,
          twitch_name_text:payload.twitch_name
        })
      : await client.from("game_requests").insert(payload);
    submitButton.disabled = false;
    if (result.error) {
      error.textContent = result.error.message || (result.error.code === "23505" ? "Another request reached the single request slot first. Please try again later." : "The request could not be submitted. Check the request slot or cooldown and try again.");
      await refreshState(); return;
    }
    dialog.close(); form.reset(); selected = null; window.location.href = "status.html";
  });
  async function initialize() {
    if (!client) { slotLabel.textContent = "Connection Error"; slotDetail.textContent = "The request service could not load."; return; }
    const { data } = await client.auth.getSession();
    session = data.session;
    await refreshOwnerAccess();
    client.auth.onAuthStateChange((_event,nextSession) => { session = nextSession; refreshOwnerAccess().then(refreshState); });
    await refreshState();
  }
  const observer = new MutationObserver(updateInterface);
  observer.observe(document.querySelector("#game-grid"), {childList:true});
  window.setInterval(refreshNextRequest, 60000);
  window.setInterval(() => {
    const wasActive = breakWasActive;
    const active = renderBreakNotice();
    if (wasActive && !active) {
      systemState.globalCooldownEnds = null;
      systemState.cooldownKind = null;
      updateInterface();
      refreshState();
    } else if (active && !ownerTestMode) {
      slotDetail.textContent = "Requests reopen in " + formatBreakCountdown(new Date(systemState.globalCooldownEnds).getTime() - Date.now()) + ".";
    }
  }, 1000);
  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "visible") refreshState();
  });
  initialize();
})();
