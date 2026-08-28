(function () {
  "use strict";
  const client = window.toxicSupabase;
  const get = (id) => document.getElementById(id);
  const labels = {pending:"Pending Review",awaiting_payment:"Awaiting Payment",approved:"Approved",denied:"Denied",expired:"Expired",cancelled:"Cancelled"};
  const messages = {
    pending:"Your game request is waiting for review. No payment is requested yet.",
    awaiting_payment:"Your request was approved for payment. The secure payment option will appear here after the payment connection is completed.",
    approved:"Your payment was confirmed and the request is approved. The global 14-day request cooldown is active unless staff reopens requests early.",
    denied:"Your request was denied. The explanation is recorded below, and the viewer request slot is open again.",
    expired:"The payment reservation expired and the viewer request slot reopened.",
    cancelled:"This request was cancelled. The viewer request slot is open again."
  };
  let session = null;
  let currentRequest = null;
  function authRedirect() { return new URL("status.html", window.location.href).href; }
  async function signIn() { await client.auth.signInWithOAuth({provider:"twitch",options:{redirectTo:authRedirect()}}); }
  function showEmpty(title,message) {
    get("status-empty").hidden = false; get("status-card").hidden = true;
    get("status-empty-title").textContent = title; get("status-empty-message").textContent = message;
  }
  function render(request,systemState) {
    currentRequest = request;
    get("status-empty").hidden = true; get("status-card").hidden = false;
    get("status-id").textContent = request.id;
    get("status-title").textContent = request.game_title;
    get("status-platform").textContent = `${request.platform || "Game"} · $${request.minimum_amount} Minimum`;
    get("status-viewer").textContent = request.twitch_name;
    get("status-time").textContent = new Date(request.created_at).toLocaleString();
    get("status-state").textContent = labels[request.status] || request.status;
    get("status-state").dataset.status = request.status;
    const globalCooldownActive = systemState?.globalCooldownEnds && new Date(systemState.globalCooldownEnds).getTime() > Date.now();
    get("status-message").textContent = request.status === "approved" && !globalCooldownActive ? "Your request remains approved. Staff reopened game requests early, so the global cooldown is no longer active." : messages[request.status] || "Request status updated.";
    const recordedReason = request.denial_reason || request.cancellation_reason;
    get("status-reason-row").hidden = !recordedReason;
    get("status-reason-label").textContent = request.cancellation_reason ? "Cancellation explanation" : "Decision explanation";
    get("status-reason").textContent = recordedReason || "";
    get("status-deadline-row").hidden = !request.payment_deadline || request.status !== "awaiting_payment";
    get("status-deadline").textContent = request.payment_deadline ? new Date(request.payment_deadline).toLocaleString() : "";
    get("cancel-request-button").hidden = request.status !== "pending";
  }
  async function loadRequest() {
    if (!session?.user) { showEmpty("Sign in to view your request","Use the same Twitch account that submitted the request."); return; }
    showEmpty("Checking request status","Loading your latest request…");
    const {data,error} = await client.from("game_requests").select("*").eq("viewer_id",session.user.id).order("created_at",{ascending:false}).limit(1).maybeSingle();
    if (error) { showEmpty("Request status unavailable","The request service could not load your status. Please try again."); return; }
    if (!data) { showEmpty("No request found","Choose a game from the catalog to begin."); return; }
    const {data:systemState} = await client.rpc("request_system_state");
    render(data,systemState);
  }
  get("status-sign-in").addEventListener("click",signIn);
  get("status-sign-out").addEventListener("click",async()=>{await client.auth.signOut();window.location.reload()});
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
    client.auth.onAuthStateChange((_event,nextSession)=>{session=nextSession;get("status-sign-in").hidden=Boolean(session);get("status-sign-out").hidden=!session;loadRequest()});
    await loadRequest();
  }
  initialize();
})();
