(function () {
  "use strict";
  const client = window.toxicSupabase;
  const get = (id) => document.getElementById(id);
  const statusLabels = {pending:"Pending Review",awaiting_payment:"Awaiting Payment",approved:"Approved",denied:"Denied",expired:"Expired",cancelled:"Cancelled"};
  let session = null;
  let pendingRequest = null;

  function authRedirect() { return new URL("review.html",window.location.href).href; }
  function message(title,copy) { get("staff-message").hidden=false;get("staff-dashboard").hidden=true;get("staff-message-title").textContent=title;get("staff-message-copy").textContent=copy; }
  async function signIn() { await client.auth.signInWithOAuth({provider:"twitch",options:{redirectTo:authRedirect()}}); }
  function make(tag,className,text) { const node=document.createElement(tag);if(className)node.className=className;if(text!==undefined)node.textContent=text;return node; }

  function renderPending(request) {
    pendingRequest=request;
    get("pending-empty").hidden=Boolean(request);get("pending-request").hidden=!request;
    if(!request)return;
    const awaiting=request.status==="awaiting_payment";
    get("live-request-heading").textContent=awaiting?"Awaiting Request":"Pending Request";
    get("pending-id").textContent=request.id;get("pending-title").textContent=request.game_title;
    get("pending-tier").textContent=`${request.request_type === "catalog" ? "Owned Catalog Game" : "Not in Catalog"} · $${request.minimum_amount} Minimum`;
    get("pending-viewer").textContent=request.twitch_name;get("pending-time").textContent=new Date(request.created_at).toLocaleString();
    get("pending-platform").textContent=request.platform||"Not specified";get("pending-note").textContent=request.viewer_note||"No note provided.";
    get("pending-status").textContent=statusLabels[request.status]||request.status;get("pending-status").dataset.status=request.status;
    get("pending-deadline-row").hidden=!awaiting||!request.payment_deadline;get("pending-deadline").textContent=request.payment_deadline?new Date(request.payment_deadline).toLocaleString():"";
    get("approve-request").hidden=awaiting;get("deny-request").hidden=awaiting;get("cancel-awaiting-request").hidden=!awaiting;
  }
  function renderHistory(requests,options={}) {
    const container=get(options.containerId||"request-history");container.replaceChildren();
    const history=options.archived?requests:requests.filter((request)=>!["pending","awaiting_payment"].includes(request.status));
    if(!history.length){container.append(make("p","request-history-empty",options.emptyMessage||"No reviewed or completed requests yet."));return;}
    history.forEach((request)=>{
      const card=make("article",`request-history-card${options.archived?" is-archived":""}`);
      const head=make("div","request-history-head");
      const copy=make("div");copy.append(make("small",null,request.id),make("h3",null,request.game_title),make("p",null,`${request.twitch_name} · $${request.minimum_amount} minimum`));
      const status=make("span","review-status",statusLabels[request.status]||request.status);status.dataset.status=request.status;
      head.append(copy,status);card.append(head);
      const details=make("p","request-history-details",`Submitted ${new Date(request.created_at).toLocaleString()} · ${request.platform||"Game"}`);card.append(details);
      if(request.denial_reason)card.append(make("p","request-history-reason",`Denial explanation: ${request.denial_reason}`));
      if(request.cancellation_reason)card.append(make("p","request-history-reason",`Cancellation explanation: ${request.cancellation_reason}`));
      if(request.payment_deadline&&request.status==="awaiting_payment")card.append(make("p","request-history-details",`Payment deadline: ${new Date(request.payment_deadline).toLocaleString()}`));
      if(options.archived&&request.archived_at){
        const archivedAt=new Date(request.archived_at);const deleteAt=new Date(archivedAt);deleteAt.setMonth(deleteAt.getMonth()+6);
        card.append(make("p","request-history-details",`Archived ${archivedAt.toLocaleString()} · Scheduled deletion after ${deleteAt.toLocaleDateString()}`));
      }
      container.append(card);
    });
  }
  async function refreshDashboard() {
    const [{data:state,error:stateError},{data:requests,error:requestsError},{data:archived,error:archiveError}] = await Promise.all([
      client.rpc("request_system_state"),
      client.from("game_requests").select("*").is("archived_at",null).order("created_at",{ascending:false}).limit(25),
      client.from("game_requests").select("*").not("archived_at","is",null).order("archived_at",{ascending:false}).limit(50)
    ]);
    if(stateError||requestsError||archiveError){message("Dashboard unavailable","Run the latest staff-control SQL upgrade, then refresh this page.");return;}
    get("staff-message").hidden=true;get("staff-dashboard").hidden=false;
    const active=state.globalCooldownEnds&&new Date(state.globalCooldownEnds).getTime()>Date.now();
    get("global-cooldown-state").textContent=active?"Cooldown Active":"Requests Open";get("global-cooldown-state").dataset.status=active?"denied":"approved";
    get("global-cooldown-message").textContent=active?`Requests are closed until ${new Date(state.globalCooldownEnds).toLocaleString()}, unless staff resets the cooldown early.`:"There is no active global cooldown. Viewers can submit a game request.";
    get("reset-global-cooldown").disabled=!active;
    renderPending(requests.find((request)=>["pending","awaiting_payment"].includes(request.status))||null);renderHistory(requests);renderHistory(archived,{containerId:"request-archive",archived:true,emptyMessage:"No requests have reached the Archive yet."});
  }
  async function initialize() {
    if(!client){message("Connection error","The staff service could not load.");return;}
    const {data}=await client.auth.getSession();session=data.session;get("staff-sign-in").hidden=Boolean(session);get("staff-sign-out").hidden=!session;
    if(!session){message("Staff sign-in required","Sign in with an authorized Twitch account to open the private controls.");return;}
    const {data:access,error}=await client.rpc("my_request_staff_access");
    if(error){message("Staff controls unavailable","The staff access check could not be completed.");return;}
    if(!access?.isStaff){message("Access denied","This Twitch account has not been assigned as the owner or authorized staff.");return;}
    get("staff-role").textContent=`Signed in as ${access.role==="owner"?"Owner":"Moderator"}`;await refreshDashboard();
  }

  get("staff-sign-in").addEventListener("click",signIn);get("staff-sign-out").addEventListener("click",async()=>{await client.auth.signOut();window.location.reload()});get("refresh-requests").addEventListener("click",refreshDashboard);

  const resetDialog=get("reset-cooldown-dialog");get("reset-global-cooldown").addEventListener("click",()=>{get("reset-cooldown-error").textContent="";resetDialog.showModal()});get("keep-global-cooldown").addEventListener("click",()=>resetDialog.close());resetDialog.querySelector(".request-dialog-close").addEventListener("click",()=>resetDialog.close());
  get("reset-cooldown-form").addEventListener("submit",async(event)=>{event.preventDefault();const {error}=await client.rpc("reset_global_request_cooldown");if(error){get("reset-cooldown-error").textContent="The cooldown could not be reset.";return}resetDialog.close();await refreshDashboard()});

  const approveDialog=get("approve-dialog");get("approve-request").addEventListener("click",()=>{get("approve-error").textContent="";approveDialog.showModal()});get("cancel-approval").addEventListener("click",()=>approveDialog.close());approveDialog.querySelector(".request-dialog-close").addEventListener("click",()=>approveDialog.close());
  get("approve-form").addEventListener("submit",async(event)=>{event.preventDefault();if(!pendingRequest)return;const {error}=await client.rpc("staff_review_game_request",{request_id:pendingRequest.id,decision:"approve",denial_explanation:null});if(error){get("approve-error").textContent="This request could not be approved. Its status may have changed.";return}approveDialog.close();await refreshDashboard()});

  const denyDialog=get("deny-dialog");get("deny-request").addEventListener("click",()=>{get("deny-reason").value="";get("deny-error").textContent="";denyDialog.showModal();get("deny-reason").focus()});denyDialog.querySelector(".request-dialog-close").addEventListener("click",()=>denyDialog.close());
  get("deny-form").addEventListener("submit",async(event)=>{event.preventDefault();if(!pendingRequest)return;const reason=get("deny-reason").value.trim();if(!reason){get("deny-error").textContent="A denial explanation is required.";return}const {error}=await client.rpc("staff_review_game_request",{request_id:pendingRequest.id,decision:"deny",denial_explanation:reason});if(error){get("deny-error").textContent="This request could not be denied. Its status may have changed.";return}denyDialog.close();await refreshDashboard()});

  const cancelAwaitingDialog=get("cancel-awaiting-dialog");get("cancel-awaiting-request").addEventListener("click",()=>{get("cancel-awaiting-reason").value="";get("cancel-awaiting-error").textContent="";cancelAwaitingDialog.showModal();get("cancel-awaiting-reason").focus()});cancelAwaitingDialog.querySelector(".request-dialog-close").addEventListener("click",()=>cancelAwaitingDialog.close());
  get("cancel-awaiting-form").addEventListener("submit",async(event)=>{event.preventDefault();if(!pendingRequest||pendingRequest.status!=="awaiting_payment")return;const reason=get("cancel-awaiting-reason").value.trim();if(!reason){get("cancel-awaiting-error").textContent="A cancellation explanation is required.";return}const {error}=await client.rpc("staff_cancel_awaiting_request",{request_id:pendingRequest.id,cancellation_explanation:reason});if(error){get("cancel-awaiting-error").textContent="This awaiting request could not be cancelled. Its status may have changed.";return}cancelAwaitingDialog.close();await refreshDashboard()});

  initialize();
})();
