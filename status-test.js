(function () {
  "use strict";
  const client = window.toxicSupabase;
  const get = (id) => document.getElementById(id);
  const labels = {pending:"Pending Review",awaiting_payment:"Approved · Awaiting Payment",approved:"Paid & Approved",denied:"Denied",expired:"Expired",cancelled:"Cancelled"};
  const requestGoalLabels = {play:"Play Game",speed_run:"Speed Run Game",completion:"100% Completion"};
  const messages = {
    pending:"Your game request is waiting for review. No payment is requested yet.",
    awaiting_payment:"Your request was approved for payment. Use the secure StreamElements option below before the deadline.",
    approved:"Your payment was confirmed and the request is approved. The global 14-day request cooldown is active unless staff reopens requests early.",
    denied:"Your request was denied. The explanation is recorded below, and the viewer request slot is open again.",
    expired:"The payment reservation expired and the viewer request slot reopened.",
    cancelled:"This request was cancelled. The viewer request slot is open again."
  };
  let session = null;
  let currentRequest = null;
  let loading = false;
  let paymentCheckRunning = false;
  const easternZone = "America/New_York";
  function authRedirect() { return new URL("status.html", window.location.href).href; }
  async function signIn() { await client.auth.signInWithOAuth({provider:"twitch",options:{redirectTo:authRedirect()}}); }
  function formatEastern(value) { return new Intl.DateTimeFormat("en-US",{timeZone:easternZone,weekday:"short",year:"numeric",month:"short",day:"numeric",hour:"numeric",minute:"2-digit",timeZoneName:"short"}).format(new Date(value)); }
  function requestGoalLabel(value) { return requestGoalLabels[value] || "Play Game"; }
  function showEmpty(title,message) {
    get("status-empty").hidden = false; get("status-card").hidden = true;
    get("status-empty-title").textContent = title; get("status-empty-message").textContent = message;
  }
  function updateCountdown() {
    if (!currentRequest || currentRequest.status !== "awaiting_payment" || !currentRequest.payment_deadline) {
      get("status-countdown").textContent = "";
      return;
    }
    const remaining = new Date(currentRequest.payment_deadline).getTime() - Date.now();
    if (remaining <= 0) {
      get("status-countdown").textContent = "Deadline reached · checking for expiration update…";
      return;
    }
    const totalSeconds = Math.floor(remaining / 1000);
    const days = Math.floor(totalSeconds / 86400);
    const hours = Math.floor((totalSeconds % 86400) / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    const parts = [];
    if (days) parts.push(`${days}d`);
    parts.push(`${hours}h`,`${minutes}m`,`${seconds}s`);
    get("status-countdown").textContent = `${parts.join(" ")} remaining`;
  }
  function render(request,systemState) {
    currentRequest = request;
    get("status-empty").hidden = true; get("status-card").hidden = false;
    get("status-id").textContent = request.id;
    get("status-title").textContent = request.game_title;
    get("status-platform").textContent = `${request.platform || "Game"} · ${requestGoalLabel(request.request_goal)} · $${request.minimum_amount}`;
    get("status-viewer").textContent = request.twitch_name;
    get("status-time").textContent = new Date(request.created_at).toLocaleString();
    get("status-goal").textContent = requestGoalLabel(request.request_goal);
    get("status-price").textContent = `$${Number(request.minimum_amount).toFixed(2)}`;
    get("status-state").textContent = labels[request.status] || request.status;
    get("status-state").dataset.status = request.status;
    const globalCooldownActive = systemState?.globalCooldownEnds && new Date(systemState.globalCooldownEnds).getTime() > Date.now();
    const approvedMessage = request.scheduled_for ? `Your payment is confirmed. Your game is scheduled for ${formatEastern(request.scheduled_for)}.` : request.status === "approved" && !globalCooldownActive ? "Your request remains approved. Staff reopened game requests early, so the global cooldown is no longer active." : messages[request.status];
    get("status-message").textContent = approvedMessage || "Request status updated.";
    const requestChanged = Boolean(request.request_changed_at && request.request_change_reason);
    get("status-change-row").hidden = !requestChanged;
    if (requestChanged) {
      const oldGame = request.previous_game_title || "Previous game";
      const oldPlatform = request.previous_platform || "Not specified";
      get("status-change").textContent = `${oldGame} (${oldPlatform}) was changed to ${request.game_title} (${request.platform || "Not specified"}). Your request choice, price, payment reference, and current status were not changed.`;
      get("status-change-reason").textContent = request.request_change_reason;
      get("status-change-time").textContent = `Updated ${new Date(request.request_changed_at).toLocaleString()}`;
    }
    const recordedReason = request.denial_reason || request.cancellation_reason;
    get("status-reason-row").hidden = !recordedReason;
    get("status-reason-label").textContent = request.cancellation_reason ? "Cancellation explanation" : "Decision explanation";
    get("status-reason").textContent = recordedReason || "";
    get("status-deadline-row").hidden = !request.payment_deadline || request.status !== "awaiting_payment";
    get("status-deadline").textContent = request.payment_deadline ? new Date(request.payment_deadline).toLocaleString() : "";
    get("status-schedule-row").hidden = request.status !== "approved";
    get("status-schedule").textContent = request.scheduled_for ? formatEastern(request.scheduled_for) : "Not scheduled yet. The streamer or moderators will record the time after everyone agrees.";
    get("status-schedule-reason-row").hidden = !request.schedule_change_reason;
    get("status-schedule-reason").textContent = request.schedule_change_reason || "";
    get("cancel-request-button").hidden = request.status !== "pending";
    get("status-last-checked").textContent = `Updated ${new Date().toLocaleTimeString()}`;
    const awaitingPayment = request.status === "awaiting_payment";
    get("payment-panel").hidden = !awaitingPayment;
    if (awaitingPayment) {
      get("payment-minimum").textContent = `$${Number(request.minimum_amount).toFixed(2)}`;
      get("payment-reference").textContent = request.payment_reference || "Preparing code…";
      get("copy-payment-reference").disabled = !request.payment_reference;
    }
    updateCountdown();
  }
  async function checkPayment() {
    if (paymentCheckRunning || currentRequest?.status !== "awaiting_payment") return;
    paymentCheckRunning = true;
    const button = get("check-payment-button");
    button.disabled = true;
    get("payment-help").textContent = "Checking StreamElements for your payment…";
    const {data,error} = await client.functions.invoke("check-game-request-payment",{body:{requestId:currentRequest.id}});
    paymentCheckRunning = false;
    button.disabled = false;
    if (error) {
      get("payment-help").textContent = "Payment confirmation is temporarily unavailable. Your payment is not lost; try Check Payment again shortly.";
      return;
    }
    if (data?.status === "approved") {
      get("payment-help").textContent = "Payment confirmed. Your request is approved!";
      await loadRequest();
      return;
    }
    if (data?.status === "expired") {
      await loadRequest();
      return;
    }
    get("payment-help").textContent = "No matching payment yet. Make sure the exact request code is included in the StreamElements tip message.";
  }
  async function loadRequest(showLoading=false) {
    if (loading) return;
    if (!session?.user) { showEmpty("Sign in to view your request","Use the same Twitch account that submitted the request."); return; }
    loading = true;
    if (showLoading && !currentRequest) showEmpty("Checking request status","Loading your latest request…");
    const {data,error} = await client.from("game_requests").select("*").eq("viewer_id",session.user.id).order("created_at",{ascending:false}).limit(1).maybeSingle();
    if (error) {
      if (!currentRequest) showEmpty("Request status unavailable","The request service could not load your status. Please try again.");
      else get("status-last-checked").textContent = "Update failed · retrying automatically";
      loading = false; return;
    }
    if (!data) { currentRequest=null;showEmpty("No request found","Choose a game from the catalog to begin.");loading=false;return; }
    const {data:systemState} = await client.rpc("request_system_state");
    render(data,systemState);
    loading = false;
  }
  get("status-sign-in").addEventListener("click",signIn);
  get("status-sign-out").addEventListener("click",async()=>{await client.auth.signOut();window.location.reload()});
  get("copy-payment-reference").addEventListener("click",async()=>{
    const reference = currentRequest?.payment_reference;
    if (!reference) return;
    await navigator.clipboard.writeText(reference);
    get("copy-payment-reference").textContent = "Copied";
    window.setTimeout(()=>{get("copy-payment-reference").textContent="Copy Code"},1500);
  });
  get("check-payment-button").addEventListener("click",checkPayment);
  const cancelDialog = get("cancel-request-dialog");
  get("cancel-request-button").addEventListener("click",()=>cancelDialog.showModal());
  get("keep-request-button").addEventListener("click",()=>cancelDialog.close());
  cancelDialog.querySelector(".request-dialog-close").addEventListener("click",()=>cancelDialog.close());
  get("cancel-request-form").addEventListener("submit",async(event)=>{
    event.preventDefault();
    if (!currentRequest || currentRequest.status !== "pending") { cancelDialog.close(); await loadRequest(); return; }
    const {error} = await client.rpc("cancel_my_game_request",{request_id:currentRequest.id});
    cancelDialog.close();
    if (error) { get("status-message").textContent = "This request could not be cancelled. Its status may have already changed."; return; }
    await loadRequest();
  });
  async function initialize() {
    if (!client) { showEmpty("Connection error","The request service could not load."); return; }
    const {data} = await client.auth.getSession(); session = data.session;
    get("status-sign-in").hidden = Boolean(session);
    get("status-sign-out").hidden = !session;
    client.auth.onAuthStateChange((_event,nextSession)=>{session=nextSession;get("status-sign-in").hidden=Boolean(session);get("status-sign-out").hidden=!session;loadRequest(true)});
    await loadRequest(true);
    await checkPayment();
    window.setInterval(async()=>{if(!document.hidden){await loadRequest();await checkPayment()}},15000);
    window.setInterval(updateCountdown,1000);
    document.addEventListener("visibilitychange",async()=>{if(!document.hidden){await loadRequest();await checkPayment()}});
  }
  initialize();
})();
