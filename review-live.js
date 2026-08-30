(function () {
  "use strict";
  const client = window.toxicSupabase;
  const get = (id) => document.getElementById(id);
  const statusLabels = {pending:"Pending Review",awaiting_payment:"Approved · Awaiting Payment",approved:"Paid & Approved",denied:"Denied",expired:"Expired",cancelled:"Cancelled"};
  const requestGoalLabels = {play:"Play Game",speed_run:"Speed Run Game",completion:"100% Completion"};
  const navigationType=performance.getEntriesByType("navigation")[0]?.type||"navigate";
  const oauthReturnPending=window.sessionStorage.getItem("toxic-staff-oauth-pending")==="true";
  if(!oauthReturnPending&&navigationType!=="reload")window.sessionStorage.removeItem("toxic-twitch-provider-token");
  let session = null;
  let providerToken = window.sessionStorage.getItem("toxic-twitch-provider-token") || "";
  let pendingRequest = null;
  let scheduleRequest = null;
  let editRequest = null;
  let staffAccessSource = null;
  let serviceEnabled = true;
  const easternZone = "America/New_York";

  function authRedirect() { return new URL("review.html",window.location.href).href; }
  function message(title,copy) { get("staff-message").hidden=false;get("staff-dashboard").hidden=true;get("staff-message-title").textContent=title;get("staff-message-copy").textContent=copy; }
  async function signIn() { window.sessionStorage.setItem("toxic-staff-oauth-pending","true");await client.auth.signInWithOAuth({provider:"twitch",options:{redirectTo:authRedirect(),scopes:"user:read:moderated_channels",queryParams:{force_verify:"true"}}}); }
  function make(tag,className,text) { const node=document.createElement(tag);if(className)node.className=className;if(text!==undefined)node.textContent=text;return node; }
  function formatEastern(value) { return new Intl.DateTimeFormat("en-US",{timeZone:easternZone,weekday:"short",year:"numeric",month:"short",day:"numeric",hour:"numeric",minute:"2-digit",timeZoneName:"short"}).format(new Date(value)); }
  function requestGoalLabel(value) { return requestGoalLabels[value] || "Play Game"; }
  function requestTierLabel(request) { return `${request.request_type === "catalog" ? "Owned Catalog Game" : "Not in Catalog"} · ${requestGoalLabel(request.request_goal)} · $${request.minimum_amount}`; }
  function canEditRequest(request) {
    return Boolean(request)
      && ["pending","awaiting_payment","approved"].includes(request.status)
      && (!request.scheduled_for || new Date(request.scheduled_for).getTime() > Date.now());
  }
  function requestChangeSummary(request) {
    const oldGame=request.previous_game_title||"Previous game";
    const oldPlatform=request.previous_platform||"Not specified";
    return `${oldGame} (${oldPlatform}) → ${request.game_title} (${request.platform||"Not specified"}). Reason: ${request.request_change_reason}`;
  }
  function easternInputValue(value) {
    if(!value)return "";
    const parts=new Intl.DateTimeFormat("en-CA",{timeZone:easternZone,year:"numeric",month:"2-digit",day:"2-digit",hour:"2-digit",minute:"2-digit",hourCycle:"h23"}).formatToParts(new Date(value));
    const part=(type)=>parts.find((item)=>item.type===type)?.value||"";
    return `${part("year")}-${part("month")}-${part("day")}T${part("hour")}:${part("minute")}`;
  }
  async function verifyAutomaticStaff() {
    if(!providerToken)return null;
    const {data,error}=await client.functions.invoke("verify-request-staff",{body:{providerToken}});
    if(error)return null;
    return data;
  }
  function openScheduleDialog(request) {
    scheduleRequest=request;
    get("schedule-title").textContent=`Schedule ${request.game_title}`;
    get("schedule-local").value=easternInputValue(request.scheduled_for);
    get("schedule-reason-row").hidden=!request.scheduled_for;
    get("schedule-reason").required=Boolean(request.scheduled_for);
    get("schedule-reason").value="";
    get("schedule-error").textContent="";
    get("clear-schedule").hidden=!request.scheduled_for;
    get("schedule-dialog").showModal();
    get("schedule-local").focus();
  }
  function openEditDialog(request) {
    if(!canEditRequest(request))return;
    editRequest=request;
    get("edit-request-tier").textContent=requestTierLabel(request);
    get("edit-game-title").value=request.game_title||"";
    get("edit-platform").value=request.platform||"";
    get("edit-reason").value="";
    get("edit-request-error").textContent="";
    get("edit-request-dialog").showModal();
    get("edit-game-title").focus();
  }

  function renderPending(request) {
    pendingRequest=request;
    get("pending-empty").hidden=Boolean(request);get("pending-request").hidden=!request;
    if(!request)return;
    const awaiting=request.status==="awaiting_payment";
    get("live-request-heading").textContent=awaiting?"Awaiting Request":"Pending Request";
    get("pending-id").textContent=request.id;get("pending-title").textContent=request.game_title;
    get("pending-tier").textContent=requestTierLabel(request);
    get("pending-viewer").textContent=request.twitch_name;get("pending-time").textContent=new Date(request.created_at).toLocaleString();
    get("pending-goal").textContent=requestGoalLabel(request.request_goal);get("pending-price").textContent=`$${Number(request.minimum_amount).toFixed(2)}`;
    get("pending-platform").textContent=request.platform||"Not specified";get("pending-note").textContent=request.viewer_note||"No note provided.";
    get("pending-change-row").hidden=!request.request_change_reason;get("pending-change").textContent=request.request_change_reason?requestChangeSummary(request):"";
    get("pending-status").textContent=statusLabels[request.status]||request.status;get("pending-status").dataset.status=request.status;
    get("pending-deadline-row").hidden=!awaiting||!request.payment_deadline;get("pending-deadline").textContent=request.payment_deadline?new Date(request.payment_deadline).toLocaleString():"";
    get("edit-request").hidden=!canEditRequest(request);get("approve-request").hidden=awaiting;get("deny-request").hidden=awaiting;get("cancel-awaiting-request").hidden=!awaiting;
  }
  function renderHistory(requests,options={}) {
    const container=get(options.containerId||"request-history");container.replaceChildren();
    const history=options.archived?requests:requests.filter((request)=>!["pending","awaiting_payment"].includes(request.status));
    if(!history.length){container.append(make("p","request-history-empty",options.emptyMessage||"No reviewed or completed requests yet."));return;}
    history.forEach((request)=>{
      const card=make("article",`request-history-card${options.archived?" is-archived":""}`);
      const head=make("div","request-history-head");
      const copy=make("div");copy.append(make("small",null,request.id),make("h3",null,request.game_title),make("p",null,`${request.twitch_name} · ${requestGoalLabel(request.request_goal)} · $${request.minimum_amount}`));
      const status=make("span","review-status",statusLabels[request.status]||request.status);status.dataset.status=request.status;
      head.append(copy,status);card.append(head);
      const details=make("p","request-history-details",`Submitted ${new Date(request.created_at).toLocaleString()} · ${request.platform||"Game"}`);card.append(details);
      if(request.denial_reason)card.append(make("p","request-history-reason",`Denial explanation: ${request.denial_reason}`));
      if(request.cancellation_reason)card.append(make("p","request-history-reason",`Cancellation explanation: ${request.cancellation_reason}`));
      if(request.request_change_reason)card.append(make("p","request-history-change",`Latest request update: ${requestChangeSummary(request)}`));
      if(request.payment_deadline&&request.status==="awaiting_payment")card.append(make("p","request-history-details",`Payment deadline: ${new Date(request.payment_deadline).toLocaleString()}`));
      if(request.scheduled_for)card.append(make("p","request-history-schedule",`Scheduled: ${formatEastern(request.scheduled_for)}`));
      if(!options.archived&&request.status==="approved"&&request.paid_at){
        const schedulePanel=make("div","request-schedule-panel");
        schedulePanel.append(make("p",null,request.scheduled_for?"The agreed game time is recorded below.":"Payment is complete. Add a date only after everyone agrees."));
        if(canEditRequest(request)){
          const editButton=make("button","review-button review-button-edit","Edit Request");
          editButton.type="button";editButton.addEventListener("click",()=>openEditDialog(request));schedulePanel.append(editButton);
        }
        const scheduleButton=make("button","review-button review-button-muted",request.scheduled_for?"Reschedule Game":"Schedule Game");
        scheduleButton.type="button";scheduleButton.addEventListener("click",()=>openScheduleDialog(request));schedulePanel.append(scheduleButton);card.append(schedulePanel);
      }
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
    serviceEnabled=state.serviceEnabled!==false;
    get("request-service-state").textContent=serviceEnabled?"Services ON":"Services OFF";get("request-service-state").dataset.status=serviceEnabled?"approved":"denied";
    get("request-service-message").textContent=serviceEnabled?"New game request submissions are available.":"New request submissions are closed until staff turns services on. Existing requests continue normally.";
    const serviceToggle=get("toggle-request-service");serviceToggle.textContent=serviceEnabled?"Turn Services Off":"Turn Services On";serviceToggle.setAttribute("aria-checked",String(serviceEnabled));serviceToggle.classList.toggle("review-button-deny",serviceEnabled);
    const active=state.globalCooldownEnds&&new Date(state.globalCooldownEnds).getTime()>Date.now();
    get("global-cooldown-state").textContent=active?"Cooldown Active":"Requests Open";get("global-cooldown-state").dataset.status=active?"denied":"approved";
    get("global-cooldown-message").textContent=active?`Requests are closed until ${new Date(state.globalCooldownEnds).toLocaleString()}, unless staff resets the cooldown early.`:serviceEnabled?"There is no active global cooldown. Viewers can submit a game request.":"There is no active global cooldown. New submissions remain closed by the manual service switch.";
    get("reset-global-cooldown").disabled=!active;
    renderPending(requests.find((request)=>["pending","awaiting_payment"].includes(request.status))||null);renderHistory(requests);renderHistory(archived,{containerId:"request-archive",archived:true,emptyMessage:"No requests have reached the Archive yet."});
  }
  async function initialize() {
    if(!client){message("Connection error","The staff service could not load.");return;}
    const {data}=await client.auth.getSession();session=data.session;if(oauthReturnPending&&session?.provider_token){providerToken=session.provider_token;window.sessionStorage.setItem("toxic-twitch-provider-token",providerToken)}window.sessionStorage.removeItem("toxic-staff-oauth-pending");get("staff-sign-in").hidden=Boolean(session);get("staff-sign-out").hidden=!session;
    if(!session){message("Staff sign-in required","Sign in with an authorized Twitch account to open the private controls.");return;}
    await verifyAutomaticStaff();
    const {data:access,error}=await client.rpc("my_request_staff_access");
    if(error){message("Staff controls unavailable","The staff access check could not be completed.");return;}
    staffAccessSource=access?.accessSource||null;
    if(!access?.isStaff||(access.accessSource==="twitch_moderator"&&!providerToken)){get("staff-sign-in").hidden=false;get("staff-sign-in").textContent="Verify moderator access";message("Moderator verification required","Sign in with Twitch again. Current channel moderators receive Staff Control automatically.");return;}
    get("staff-role").textContent=`Signed in as ${access.role==="owner"?"Owner":"Moderator"}`;await refreshDashboard();
  }

  get("staff-sign-in").addEventListener("click",signIn);get("staff-sign-out").addEventListener("click",async()=>{providerToken="";staffAccessSource=null;window.sessionStorage.removeItem("toxic-twitch-provider-token");window.sessionStorage.removeItem("toxic-staff-oauth-pending");await client.auth.signOut();window.location.reload()});get("refresh-requests").addEventListener("click",refreshDashboard);

  const serviceDialog=get("toggle-service-dialog");get("toggle-request-service").addEventListener("click",()=>{const turningOn=!serviceEnabled;get("toggle-service-error").textContent="";get("toggle-service-title").textContent=turningOn?"Turn new game requests on?":"Turn new game requests off?";get("toggle-service-copy").textContent=turningOn?"This restores new request submissions. Any active global cooldown still applies.":"This immediately blocks only new request submissions. Existing requests can still be reviewed, paid, confirmed, or expired normally.";const confirm=get("confirm-service-toggle");confirm.textContent=turningOn?"Turn Services On":"Turn Services Off";confirm.classList.toggle("review-button-deny",!turningOn);serviceDialog.showModal()});get("keep-service-state").addEventListener("click",()=>serviceDialog.close());serviceDialog.querySelector(".request-dialog-close").addEventListener("click",()=>serviceDialog.close());
  get("toggle-service-form").addEventListener("submit",async(event)=>{event.preventDefault();const nextState=!serviceEnabled;const confirm=get("confirm-service-toggle");confirm.disabled=true;const {error}=await client.rpc("set_request_service_enabled",{enabled:nextState});confirm.disabled=false;if(error){get("toggle-service-error").textContent="The service state could not be changed.";return}serviceDialog.close();await refreshDashboard()});

  const resetDialog=get("reset-cooldown-dialog");get("reset-global-cooldown").addEventListener("click",()=>{get("reset-cooldown-error").textContent="";resetDialog.showModal()});get("keep-global-cooldown").addEventListener("click",()=>resetDialog.close());resetDialog.querySelector(".request-dialog-close").addEventListener("click",()=>resetDialog.close());
  get("reset-cooldown-form").addEventListener("submit",async(event)=>{event.preventDefault();const {error}=await client.rpc("reset_global_request_cooldown");if(error){get("reset-cooldown-error").textContent="The cooldown could not be reset.";return}resetDialog.close();await refreshDashboard()});

  const approveDialog=get("approve-dialog");get("approve-request").addEventListener("click",()=>{get("approve-error").textContent="";approveDialog.showModal()});get("cancel-approval").addEventListener("click",()=>approveDialog.close());approveDialog.querySelector(".request-dialog-close").addEventListener("click",()=>approveDialog.close());
  get("approve-form").addEventListener("submit",async(event)=>{event.preventDefault();if(!pendingRequest)return;const {error}=await client.rpc("staff_review_game_request",{request_id:pendingRequest.id,decision:"approve",denial_explanation:null});if(error){get("approve-error").textContent="This request could not be approved. Its status may have changed.";return}approveDialog.close();await refreshDashboard()});

  const denyDialog=get("deny-dialog");get("deny-request").addEventListener("click",()=>{get("deny-reason").value="";get("deny-error").textContent="";denyDialog.showModal();get("deny-reason").focus()});denyDialog.querySelector(".request-dialog-close").addEventListener("click",()=>denyDialog.close());
  get("deny-form").addEventListener("submit",async(event)=>{event.preventDefault();if(!pendingRequest)return;const reason=get("deny-reason").value.trim();if(!reason){get("deny-error").textContent="A denial explanation is required.";return}const {error}=await client.rpc("staff_review_game_request",{request_id:pendingRequest.id,decision:"deny",denial_explanation:reason});if(error){get("deny-error").textContent="This request could not be denied. Its status may have changed.";return}denyDialog.close();await refreshDashboard()});

  const cancelAwaitingDialog=get("cancel-awaiting-dialog");get("cancel-awaiting-request").addEventListener("click",()=>{get("cancel-awaiting-reason").value="";get("cancel-awaiting-error").textContent="";cancelAwaitingDialog.showModal();get("cancel-awaiting-reason").focus()});cancelAwaitingDialog.querySelector(".request-dialog-close").addEventListener("click",()=>cancelAwaitingDialog.close());
  get("cancel-awaiting-form").addEventListener("submit",async(event)=>{event.preventDefault();if(!pendingRequest||pendingRequest.status!=="awaiting_payment")return;const reason=get("cancel-awaiting-reason").value.trim();if(!reason){get("cancel-awaiting-error").textContent="A cancellation explanation is required.";return}const {error}=await client.rpc("staff_cancel_awaiting_request",{request_id:pendingRequest.id,cancellation_explanation:reason});if(error){get("cancel-awaiting-error").textContent="This awaiting request could not be cancelled. Its status may have changed.";return}cancelAwaitingDialog.close();await refreshDashboard()});

  const editDialog=get("edit-request-dialog");get("edit-request").addEventListener("click",()=>openEditDialog(pendingRequest));get("cancel-request-edit").addEventListener("click",()=>editDialog.close());editDialog.querySelector(".request-dialog-close").addEventListener("click",()=>editDialog.close());
  get("edit-request-form").addEventListener("submit",async(event)=>{
    event.preventDefault();
    if(!canEditRequest(editRequest)){get("edit-request-error").textContent="This request can no longer be edited.";return;}
    const title=get("edit-game-title").value.trim();const platform=get("edit-platform").value.trim();const reason=get("edit-reason").value.trim();
    if(!title){get("edit-request-error").textContent="Enter the corrected game title.";return;}
    if(!platform){get("edit-request-error").textContent="Enter the corrected console or system.";return;}
    if(reason.length<10){get("edit-request-error").textContent="Explain the change in at least 10 characters.";return;}
    if(title===editRequest.game_title&&platform===(editRequest.platform||"")){get("edit-request-error").textContent="Change the game title or console before saving.";return;}
    const save=get("save-request-edit");save.disabled=true;
    const {error}=await client.rpc("staff_edit_game_request",{request_id:editRequest.id,new_game_title:title,new_platform:platform,change_explanation:reason});
    save.disabled=false;
    if(error){get("edit-request-error").textContent=error.message||"This request could not be updated.";return;}
    editDialog.close();editRequest=null;await refreshDashboard();
  });

  const scheduleDialog=get("schedule-dialog");scheduleDialog.querySelector(".request-dialog-close").addEventListener("click",()=>scheduleDialog.close());
  get("schedule-form").addEventListener("submit",async(event)=>{event.preventDefault();if(!scheduleRequest)return;const localValue=get("schedule-local").value;const reason=get("schedule-reason").value.trim();if(!localValue){get("schedule-error").textContent="Choose an Eastern date and time.";return}if(scheduleRequest.scheduled_for&&!reason){get("schedule-error").textContent="Explain why the scheduled time is changing.";return}const save=get("save-schedule");save.disabled=true;const {error}=await client.rpc("staff_schedule_game_request",{request_id:scheduleRequest.id,scheduled_local:localValue,schedule_explanation:reason||null});save.disabled=false;if(error){get("schedule-error").textContent=error.message?.includes("future")?"Choose a date and time in the future.":error.message?.includes("explanation")?"Explain why the scheduled time is changing.":"This schedule could not be saved. Confirm that payment is complete.";return}scheduleDialog.close();await refreshDashboard()});
  get("clear-schedule").addEventListener("click",async()=>{if(!scheduleRequest)return;const reason=get("schedule-reason").value.trim();if(!reason){get("schedule-error").textContent="Explain why the scheduled time is being cleared.";return}const button=get("clear-schedule");button.disabled=true;const {error}=await client.rpc("staff_schedule_game_request",{request_id:scheduleRequest.id,scheduled_local:null,schedule_explanation:reason});button.disabled=false;if(error){get("schedule-error").textContent=error.message?.includes("explanation")?"Explain why the scheduled time is being cleared.":"This schedule could not be cleared.";return}scheduleDialog.close();await refreshDashboard()});

  if(client)client.auth.onAuthStateChange((event,nextSession)=>{if(oauthReturnPending&&nextSession?.provider_token){providerToken=nextSession.provider_token;window.sessionStorage.setItem("toxic-twitch-provider-token",providerToken)}if(event==="SIGNED_OUT"){providerToken="";window.sessionStorage.removeItem("toxic-twitch-provider-token")}});
  initialize();
  window.setInterval(async()=>{if(providerToken&&!document.hidden){const verified=await verifyAutomaticStaff();if(verified&&verified.isStaff===false){message("Moderator access ended","Twitch no longer lists this account as a moderator for this channel.");}}},55*60*1000);
  document.addEventListener("visibilitychange",async()=>{if(!document.hidden&&providerToken&&staffAccessSource==="twitch_moderator"){const verified=await verifyAutomaticStaff();if(verified&&verified.isStaff===false){providerToken="";window.sessionStorage.removeItem("toxic-twitch-provider-token");get("staff-sign-in").hidden=false;get("staff-sign-in").textContent="Verify moderator access";message("Moderator access ended","Twitch no longer lists this account as a moderator for this channel.");}}});
  window.addEventListener("pageshow",(event)=>{if(event.persisted&&staffAccessSource==="twitch_moderator"){providerToken="";window.sessionStorage.removeItem("toxic-twitch-provider-token");get("staff-sign-in").hidden=false;get("staff-sign-in").textContent="Verify moderator access";message("Moderator verification required","You left Staff Control. Sign in with Twitch again to re-establish moderator access.");}});
})();
