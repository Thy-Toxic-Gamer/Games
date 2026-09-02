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
  let completionRequest = null;
  let viewerChangeReviewRequest = null;
  let staffAccessSource = null;
  let staffRole = null;
  let serviceEnabled = true;
  let globalCooldownEnds = null;
  let unresolvedDiscordFailure = null;
  let activeStaffTab = "home";
  const catalog = window.TOXIC_CATALOG;
  const editGamePicker = catalog?.enhanceOwnedGameInput({
    titleInput:get("edit-game-title"),
    platformInput:get("edit-platform"),
    errorElement:get("edit-request-error"),
  });
  const easternZone = "America/New_York";

  function authRedirect() { return new URL("review.html",window.location.href).href; }
  function message(title,copy) { get("staff-message").hidden=false;get("staff-dashboard").hidden=true;get("staff-message-title").textContent=title;get("staff-message-copy").textContent=copy; }
  async function signIn() { window.sessionStorage.setItem("toxic-staff-oauth-pending","true");await client.auth.signInWithOAuth({provider:"twitch",options:{redirectTo:authRedirect(),scopes:"user:read:moderated_channels",queryParams:{force_verify:"true"}}}); }
  function make(tag,className,text) { const node=document.createElement(tag);if(className)node.className=className;if(text!==undefined)node.textContent=text;return node; }
  function activateStaffTab(name,focusPanel=false) {
    const requested=get(`staff-tab-${name}`)?name:"home";activeStaffTab=requested;
    document.querySelectorAll("[data-staff-tab]").forEach((tab)=>{const active=tab.dataset.staffTab===requested;tab.classList.toggle("active",active);tab.setAttribute("aria-selected",String(active));tab.tabIndex=active?0:-1;});
    document.querySelectorAll("[data-staff-panel]").forEach((panel)=>{panel.hidden=panel.dataset.staffPanel!==requested;});
    if(focusPanel){const panel=get(`staff-panel-${requested}`);panel?.focus({preventScroll:true});panel?.scrollIntoView({behavior:"smooth",block:"start"});}
  }
  function setupStaffTabs() {
    const tabs=Array.from(document.querySelectorAll("[data-staff-tab]"));
    tabs.forEach((tab,index)=>{
      tab.addEventListener("click",()=>activateStaffTab(tab.dataset.staffTab));
      tab.addEventListener("keydown",(event)=>{let next=null;if(event.key==="ArrowRight")next=(index+1)%tabs.length;if(event.key==="ArrowLeft")next=(index-1+tabs.length)%tabs.length;if(event.key==="Home")next=0;if(event.key==="End")next=tabs.length-1;if(next===null)return;event.preventDefault();activateStaffTab(tabs[next].dataset.staffTab);tabs[next].focus();});
    });
    document.querySelectorAll("[data-staff-tab-target]").forEach((button)=>button.addEventListener("click",()=>activateStaffTab(button.dataset.staffTabTarget,true)));
    activateStaffTab("home");
  }
  function renderStaffReviewAlerts(requests) {
    const container=get("staff-review-alerts");container.replaceChildren();
    const pendingReview=requests.find((request)=>request.status==="pending")||null;
    const pendingChanges=requests.filter((request)=>request.viewer_change_status==="pending"&&request.viewer_change_game_title);
    const activeChangeCount=pendingChanges.filter((request)=>["pending","awaiting_payment"].includes(request.status)).length;
    const recordsChangeCount=pendingChanges.length-activeChangeCount;
    const activeCount=(pendingReview?1:0)+activeChangeCount;
    const activeBadge=get("staff-active-count");activeBadge.textContent=String(activeCount);activeBadge.hidden=activeCount===0;
    const recordsBadge=get("staff-records-count");recordsBadge.textContent=String(recordsChangeCount);recordsBadge.hidden=recordsChangeCount===0;
    const appendAlert=(kind,title,copy,target,label)=>{
      const card=make("article",`staff-review-alert is-${kind}`);const light=make("span","staff-review-light");light.setAttribute("aria-hidden","true");
      const text=make("div");text.append(make("small",null,"Staff Review Queue"),make("strong",null,title),make("span",null,copy));
      const action=make("button",kind==="change"?"review-button review-button-edit":"review-button",label);action.type="button";action.addEventListener("click",()=>activateStaffTab(target,true));
      card.append(light,text,action);container.append(card);
    };
    if(pendingReview)appendAlert("request","Request Pending Review",`${pendingReview.game_title} · ${pendingReview.platform||"System not specified"} is waiting for approval or denial.`,"active","Review Request");
    pendingChanges.forEach((request)=>appendAlert("change","Game Change Pending Review",`${request.game_title} → ${request.viewer_change_game_title} · ${request.viewer_change_platform||"System not specified"}.`,["pending","awaiting_payment"].includes(request.status)?"active":"records","Review Game Change"));
    if(!pendingReview&&!pendingChanges.length){const card=make("article","staff-review-alert is-clear");const light=make("span","staff-review-light");light.setAttribute("aria-hidden","true");const text=make("div");text.append(make("small",null,"Staff Review Queue"),make("strong",null,"No Staff Review Pending"),make("span",null,"No new requests or game changes are waiting for a staff decision."));card.append(light,text);container.append(card);}
  }
  function discordEventLabel(value) { return String(value||"notification").replaceAll("_"," ").replace(/\b\w/g,(letter)=>letter.toUpperCase()); }
  function discordDeliveryTime(value) { return value ? new Date(value).toLocaleString() : "Not recorded"; }
  function renderDiscordHealth(health) {
    unresolvedDiscordFailure=health?.unresolvedFailure||null;
    const state=get("discord-health-state");
    const connected=health?.configured===true;
    const needsAttention=Boolean(unresolvedDiscordFailure);
    state.textContent=!connected?"Setup Required":needsAttention?"Needs Attention":"Connected";
    state.dataset.status=!connected||needsAttention?"denied":"approved";
    get("staff-summary-discord").textContent=!connected?"Unavailable":needsAttention?"Attention":"Connected";
    get("staff-summary-discord-copy").textContent=!connected?"The system-log connection needs setup.":needsAttention?"A failed notification is waiting for review.":"Discord delivery is operating normally.";
    get("staff-summary-discord").closest("article").dataset.status=!connected||needsAttention?"attention":"normal";
    get("staff-admin-signal").dataset.status=!connected||needsAttention?"attention":"connected";
    get("discord-health-connection").textContent=connected?"Connected to #request-system-logs":"System-log webhook unavailable";
    get("discord-health-connection-copy").textContent=connected?"The webhook is stored securely and can be tested below.":"Confirm that DISCORD_SYSTEM_LOG_WEBHOOK_URL is saved in Supabase.";
    const success=health?.lastSuccess;
    get("discord-last-success").textContent=success?discordDeliveryTime(success.deliveredAt||success.createdAt):"No delivery recorded";
    get("discord-last-success-copy").textContent=success?`${discordEventLabel(success.eventType)} · ${success.target}`:"Send a test notification to create the first health record.";
    const failure=health?.lastFailure;
    get("discord-last-failure").textContent=failure?discordDeliveryTime(failure.createdAt):"No failure recorded";
    get("discord-last-failure-copy").textContent=failure?`${discordEventLabel(failure.eventType)} · ${failure.resolvedAt?"Resolved":"Unresolved"}${failure.errorMessage?` · ${failure.errorMessage}`:""}`:"No Discord failures have been recorded.";
    const retry=get("retry-discord-notification");retry.hidden=!unresolvedDiscordFailure;retry.disabled=!unresolvedDiscordFailure;
    const log=get("discord-health-log");log.replaceChildren();
    const items=Array.isArray(health?.logs)?health.logs:[];
    if(!items.length){log.append(make("p","request-history-empty","No Discord delivery activity has been recorded yet."));return;}
    items.slice(0,8).forEach((item)=>{
      const row=make("article",`discord-health-log-item is-${item.status}`);
      const copy=make("div");copy.append(make("small",null,request.is_test?"🧪 Owner Test · "+request.id:request.id),make("h3",null,request.game_title),make("p",null,request.twitch_name+" · "+requestGoalLabel(request.request_goal)+" · "+(request.is_test?"$0 Owner Test":"$"+request.minimum_amount)));
      if(item.errorMessage)copy.append(make("small",null,item.errorMessage));
      const badge=make("span","review-status",item.status==="success"?"Delivered":item.resolvedAt?"Resolved":"Failed");badge.dataset.status=item.status==="success"||item.resolvedAt?"approved":"denied";
      row.append(copy,badge);log.append(row);
    });
  }
  async function refreshDiscordHealth() {
    const feedback=get("discord-health-feedback");feedback.textContent="Checking Discord delivery health…";feedback.dataset.status="working";
    const {data,error}=await client.functions.invoke("discord-notification-health",{body:{action:"status"}});
    if(error||data?.error){unresolvedDiscordFailure=null;get("discord-health-state").textContent="Unavailable";get("discord-health-state").dataset.status="denied";get("staff-summary-discord").textContent="Unavailable";get("staff-summary-discord-copy").textContent="Discord health could not be checked.";get("staff-summary-discord").closest("article").dataset.status="attention";get("staff-admin-signal").dataset.status="attention";feedback.textContent="Discord health is not available yet. Confirm the database upgrade and Edge Function deployment.";feedback.dataset.status="error";return false;}
    renderDiscordHealth(data);feedback.textContent="Discord health is up to date.";feedback.dataset.status="success";return true;
  }
  async function runDiscordHealthAction(action,button,logId=null) {
    const feedback=get("discord-health-feedback");button.disabled=true;feedback.textContent=action==="test"?"Sending a private test notification…":"Retrying the failed Discord notification…";feedback.dataset.status="working";
    const {data,error}=await client.functions.invoke("discord-notification-health",{body:{action,...(logId?{logId}: {})}});
    button.disabled=false;
    if(error||data?.error){const errorCopy=data?.error||`The Discord ${action} could not be completed. Check the Edge Function logs for details.`;await refreshDiscordHealth();feedback.textContent=errorCopy;feedback.dataset.status="error";return;}
    if(data?.health)renderDiscordHealth(data.health);else await refreshDiscordHealth();
    feedback.textContent=action==="test"?"Test delivered to #request-system-logs.":"Failed notification delivered successfully.";feedback.dataset.status="success";
  }
  function formatEastern(value) { return new Intl.DateTimeFormat("en-US",{timeZone:easternZone,weekday:"short",year:"numeric",month:"short",day:"numeric",hour:"numeric",minute:"2-digit",timeZoneName:"short"}).format(new Date(value)); }
  function cooldownRemaining(value) {
    const remaining=Math.max(0,new Date(value).getTime()-Date.now());
    const totalSeconds=Math.floor(remaining/1000);
    const days=Math.floor(totalSeconds/86400);
    const hours=Math.floor((totalSeconds%86400)/3600);
    const minutes=Math.floor((totalSeconds%3600)/60);
    const seconds=totalSeconds%60;
    return [days?days+"d":"",hours||days?hours+"h":"",minutes||hours||days?minutes+"m":"",seconds+"s"].filter(Boolean).join(" ");
  }
  function renderGlobalCooldownState() {
    const active=Boolean(globalCooldownEnds&&new Date(globalCooldownEnds).getTime()>Date.now());
    get("global-cooldown-state").textContent=active?"Cooldown Active":"No Cooldown";
    get("global-cooldown-state").dataset.status=active?"cooldown":"approved";
    get("global-cooldown-message").textContent=active
      ? "Public requests reopen "+formatEastern(globalCooldownEnds)+" · Time remaining: "+cooldownRemaining(globalCooldownEnds)
      : serviceEnabled
        ? "There is no active global cooldown. Viewers can submit a game request."
        : "There is no active global cooldown. New submissions remain closed by the manual service switch.";
    get("reset-global-cooldown").disabled=!active;
  }
  function requestGoalLabel(value) { return requestGoalLabels[value] || "Play Game"; }
  function requestStatusLabel(request) { return request?.completed_at ? "Completed" : statusLabels[request?.status] || request?.status || "Unknown"; }
  function requestTierLabel(request) { return (request.request_type === "catalog" ? "Owned Catalog Game" : "Not in Catalog")+" · "+requestGoalLabel(request.request_goal)+" · "+(request.is_test ? "Owner Test · $0" : "$"+request.minimum_amount); }
  function catalogSummary(gameTitle) { return window.GAME_SUMMARIES?.[gameTitle] || ""; }
  function catalogReleaseYear(gameTitle) { const suffix=`::${gameTitle}`;const match=Object.entries(window.GAME_RELEASE_YEARS||{}).find(([key])=>key.endsWith(suffix));return match?.[1]||""; }
  function canEditRequest(request) {
    return Boolean(request)
      && !request.completed_at
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
    get("schedule-game-summary").value=request.game_summary||catalogSummary(request.game_title);
    get("schedule-release-year").value=request.release_year||catalogReleaseYear(request.game_title);
    get("schedule-reason-row").hidden=!request.scheduled_for;
    get("schedule-reason").required=Boolean(request.scheduled_for);
    get("schedule-reason").value="";
    get("schedule-error").textContent="";
    get("clear-schedule").hidden=!request.scheduled_for;
    get("schedule-dialog").showModal();
    get("schedule-local").focus();
  }
  function normalizeVodUrl(value,service) {
    const parsed=new URL(value.trim());
    const host=parsed.hostname.toLowerCase().replace(/^www\./,"");
    if(service==="youtube"&&!(["youtube.com","youtu.be"].includes(host)))throw new Error("Enter a valid YouTube VOD link.");
    if(service==="twitch"&&(host!=="twitch.tv"||!/^\/videos\/\d+/.test(parsed.pathname)))throw new Error("Enter a valid Twitch VOD link.");
    parsed.searchParams.delete("t");parsed.searchParams.delete("start");parsed.hash="";
    return parsed.toString();
  }
  function updateCompletionViewLinks() {
    [["twitch","completion-twitch","completion-view-twitch"],["youtube","completion-youtube","completion-view-youtube"]].forEach(([service,inputId,linkId])=>{
      const link=get(linkId);let url="";
      try{const value=get(inputId).value.trim();if(value)url=normalizeVodUrl(value,service);}catch{}
      if(url){link.href=url;link.setAttribute("aria-disabled","false");}
      else{link.removeAttribute("href");link.setAttribute("aria-disabled","true");}
    });
  }
  function openCompletionDialog(request) {
    completionRequest=request;
    const updating=Boolean(request.completed_at);
    get("completion-title").textContent=updating?"Update Completed Stream":"Mark Request Complete";
    get("completion-request-summary").textContent=`${request.game_title} · ${request.platform||"System not specified"} · ${requestGoalLabel(request.request_goal)}`;
    get("completion-local").value=easternInputValue(request.completed_at||new Date().toISOString());
    get("completion-youtube").value=request.youtube_vod_url||"";
    get("completion-twitch").value=request.twitch_vod_url||"";
    updateCompletionViewLinks();
    get("completion-lookup-status").textContent="";
    get("completion-error").textContent="";
    get("save-completion").textContent=updating?"Update Completed Stream":"Publish Completed Stream";
    get("completion-dialog").showModal();get("completion-twitch").focus();
  }
  function completedVodLinks(request) {
    const links=make("p","request-history-vods");
    const twitchActive=request.twitch_vod_url&&request.twitch_vod_expires_at&&new Date(request.twitch_vod_expires_at).getTime()>Date.now();
    if(twitchActive){const twitch=make("a","completed-vod-link vod-twitch","Watch on Twitch");twitch.href=request.twitch_vod_url;twitch.target="_blank";twitch.rel="noopener noreferrer";links.append(twitch);}
    if(request.youtube_vod_url){if(links.childNodes.length)links.append(document.createTextNode(" · "));const youtube=make("a","completed-vod-link vod-youtube","Watch on YouTube");youtube.href=request.youtube_vod_url;youtube.target="_blank";youtube.rel="noopener noreferrer";links.append(youtube);}
    return links;
  }
  function hasPendingViewerChange(request) { return request?.viewer_change_status === "pending" && Boolean(request.viewer_change_game_title); }
  function openEditDialog(request,useViewerChange=false) {
    if(!canEditRequest(request))return;
    editRequest=request;
    get("edit-request-tier").textContent=requestTierLabel(request);
    const title=useViewerChange?request.viewer_change_game_title||"":request.game_title||"";
    const platform=useViewerChange?request.viewer_change_platform||"":request.platform||"";
    const catalogRequest=request.request_type==="catalog";
    editGamePicker?.setEnabled(catalogRequest);
    editGamePicker?.reset();
    get("edit-game-title").value=title;
    get("edit-platform").value=platform;
    if(catalogRequest)editGamePicker?.select(catalog?.findExact(title,platform));
    get("edit-reason").value=useViewerChange?`Approved viewer change request: ${request.viewer_change_reason||"Replacement approved by staff."}`.slice(0,500):"";
    get("save-request-edit").textContent=useViewerChange?"Approve and Apply Change":"Save Request Update";
    get("edit-request-error").textContent="";
    get("edit-request-dialog").showModal();
    get("edit-game-title").focus();
  }
  function openViewerChangeDenyDialog(request) {
    if(!hasPendingViewerChange(request))return;
    viewerChangeReviewRequest=request;
    get("deny-viewer-change-reason").value="";
    get("deny-viewer-change-error").textContent="";
    get("deny-viewer-change-dialog").showModal();
    get("deny-viewer-change-reason").focus();
  }
  function makeViewerChangePanel(request) {
    if(!hasPendingViewerChange(request))return null;
    const panel=make("section","staff-viewer-change");
    panel.append(make("p","eyebrow","Viewer Requested a Change"),make("h3",null,`${request.viewer_change_game_title} · ${request.viewer_change_platform||"System not specified"}`),make("p",null,request.viewer_change_reason||"No explanation provided."));
    const actions=make("div","review-actions");
    const apply=make("button","review-button review-button-edit","Apply Viewer Change");apply.type="button";apply.addEventListener("click",()=>openEditDialog(request,true));
    const deny=make("button","review-button review-button-deny","Deny Viewer Change");deny.type="button";deny.addEventListener("click",()=>openViewerChangeDenyDialog(request));
    actions.append(apply,deny);panel.append(actions);return panel;
  }

  function renderPending(request) {
    pendingRequest=request;
    get("staff-summary-slot").textContent=!request?"Open":request.status==="pending"?"Review Required":"In Use";
    get("staff-summary-slot-copy").textContent=!request?"No request is waiting in the live queue.":request.status==="pending"?`${request.game_title} is waiting for staff review.`:`${request.game_title} is awaiting payment.`;
    get("staff-summary-slot").closest("article").dataset.status=request?.status==="pending"?"attention":"normal";
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
    const viewerChange=get("pending-viewer-change");viewerChange.hidden=!hasPendingViewerChange(request);
    if(hasPendingViewerChange(request)){get("pending-viewer-change-title").textContent=`${request.viewer_change_game_title} · ${request.viewer_change_platform||"System not specified"}`;get("pending-viewer-change-reason").textContent=request.viewer_change_reason||"No explanation provided.";}
    get("edit-request").hidden=!canEditRequest(request);get("approve-request").hidden=awaiting;get("deny-request").hidden=awaiting;get("cancel-awaiting-request").hidden=!awaiting;
  }
  function isFinalRequestRecord(request) {
    return Boolean(request.completed_at)||["denied","expired","cancelled"].includes(request.status);
  }
  async function archiveRequestRecord(request,button) {
    if(!window.confirm(`Move "${request.game_title}" to Archive? Staff will still be able to view it in the Archive tab.`))return;
    button.disabled=true;
    const {error}=await client.rpc("staff_archive_game_request",{target_request_id:request.id});
    if(error){window.alert(error.message||"The request could not be archived.");button.disabled=false;return;}
    await refreshDashboard();
  }
  async function permanentlyDeleteRequestRecord(request,button) {
    if(staffRole!=="owner")return;
    if(!window.confirm(`Permanently delete "${request.game_title}" and its related request records? This cannot be undone.`))return;
    button.disabled=true;
    const {error}=await client.rpc("owner_delete_game_request",{target_request_id:request.id});
    if(error){window.alert(error.message||"The request could not be permanently deleted.");button.disabled=false;return;}
    await refreshDashboard();
  }
  async function permanentlyDeleteAllArchivedRequests(requests,button) {
    if(staffRole!=="owner"||!requests.length)return;
    const count=requests.length;
    const label=count===1?"archived request":"archived requests";
    if(!window.confirm(`Permanently delete all ${count} ${label}? This cannot be undone.`))return;
    button.disabled=true;
    const {data,error}=await client.rpc("owner_delete_all_archived_game_requests");
    if(error){window.alert(error.message||"The archived requests could not be permanently deleted.");button.disabled=false;return;}
    const deletedCount=Number(data?.deletedCount??count);
    window.alert(`Permanently deleted ${deletedCount} archived request${deletedCount===1?"":"s"}.`);
    await refreshDashboard();
  }

  function renderHistory(requests,options={}) {
    const container=get(options.containerId||"request-history");container.replaceChildren();
    const history=options.archived?requests:requests.filter((request)=>!["pending","awaiting_payment"].includes(request.status));
    if(!history.length){container.append(make("p","request-history-empty",options.emptyMessage||"No reviewed or completed requests yet."));return;}
    if(options.archived&&staffRole==="owner"){
      const toolbar=make("div","request-archive-toolbar");
      const deleteAllButton=make("button","review-button review-button-deny",`Delete All Archived Requests (${history.length})`);
      deleteAllButton.type="button";
      deleteAllButton.addEventListener("click",()=>permanentlyDeleteAllArchivedRequests(history,deleteAllButton));
      toolbar.append(deleteAllButton);
      container.append(toolbar);
    }
    history.forEach((request)=>{
      const card=make("article",`request-history-card${options.archived?" is-archived":""}`);
      const head=make("div","request-history-head");
      const copy=make("div");copy.append(make("small",null,request.id),make("h3",null,request.game_title),make("p",null,`${request.twitch_name} · ${requestGoalLabel(request.request_goal)} · $${request.minimum_amount}`));
      const status=make("span","review-status",requestStatusLabel(request));status.dataset.status=request.completed_at?"completed":request.status;
      head.append(copy,status);card.append(head);
      const details=make("p","request-history-details",`Submitted ${new Date(request.created_at).toLocaleString()} · ${request.platform||"Game"}`);card.append(details);
      if(request.denial_reason)card.append(make("p","request-history-reason",`Denial explanation: ${request.denial_reason}`));
      if(request.cancellation_reason)card.append(make("p","request-history-reason",`Cancellation explanation: ${request.cancellation_reason}`));
      if(request.request_change_reason)card.append(make("p","request-history-change",`Latest request update: ${requestChangeSummary(request)}`));
      const viewerChangePanel=!options.archived?makeViewerChangePanel(request):null;if(viewerChangePanel)card.append(viewerChangePanel);
      if(request.payment_deadline&&request.status==="awaiting_payment")card.append(make("p","request-history-details",`Payment deadline: ${new Date(request.payment_deadline).toLocaleString()}`));
      if(request.scheduled_for)card.append(make("p","request-history-schedule",`Scheduled: ${formatEastern(request.scheduled_for)}`));
      if(request.completed_at){
        card.append(make("p","request-history-completed",`Requested stream completed ${formatEastern(request.completed_at)}.`));
        if(request.youtube_vod_url)card.append(completedVodLinks(request));
        if(!options.archived){const updateCompletion=make("button","review-button review-button-edit","Update Completion Links");updateCompletion.type="button";updateCompletion.addEventListener("click",()=>openCompletionDialog(request));card.append(updateCompletion);}
      }
      if(!options.archived&&request.status==="approved"&&request.paid_at&&!request.completed_at){
        const schedulePanel=make("div","request-schedule-panel");
        schedulePanel.append(make("p",null,request.scheduled_for?"The agreed game time is recorded below.":"Payment is complete. Add a date only after everyone agrees."));
        if(canEditRequest(request)){
          const editButton=make("button","review-button review-button-edit","Edit Request");
          editButton.type="button";editButton.addEventListener("click",()=>openEditDialog(request));schedulePanel.append(editButton);
        }
        const scheduleButton=make("button","review-button review-button-muted",request.scheduled_for?"Reschedule Game":"Schedule Game");
        scheduleButton.type="button";scheduleButton.addEventListener("click",()=>openScheduleDialog(request));schedulePanel.append(scheduleButton);
        const completeButton=make("button","review-button","Mark Request Complete");completeButton.type="button";completeButton.addEventListener("click",()=>openCompletionDialog(request));schedulePanel.append(completeButton);card.append(schedulePanel);
      }
      if(!options.archived&&isFinalRequestRecord(request)){
        const actions=make("div","request-record-actions");
        const archiveButton=make("button","review-button review-button-muted","Move to Archive");
        archiveButton.type="button";archiveButton.addEventListener("click",()=>archiveRequestRecord(request,archiveButton));actions.append(archiveButton);
        if(staffRole==="owner"){
          const deleteButton=make("button","review-button review-button-deny","Permanently Delete");
          deleteButton.type="button";deleteButton.addEventListener("click",()=>permanentlyDeleteRequestRecord(request,deleteButton));actions.append(deleteButton);
        }
        card.append(actions);
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
    get("staff-summary-services").textContent=serviceEnabled?"ON":"OFF";get("staff-summary-services-copy").textContent=serviceEnabled?"New requests may be submitted when no other restriction applies.":"New submissions are paused; existing requests continue.";
    get("staff-summary-services").closest("article").dataset.status=serviceEnabled?"normal":"attention";
    get("request-service-state").textContent=serviceEnabled?"Services ON":"Services OFF";get("request-service-state").dataset.status=serviceEnabled?"approved":"denied";
    get("request-service-message").textContent=serviceEnabled?"New game request submissions are available.":"New request submissions are closed until staff turns services on. Existing requests continue normally.";
    const serviceToggle=get("toggle-request-service");serviceToggle.textContent=serviceEnabled?"Turn Services Off":"Turn Services On";serviceToggle.setAttribute("aria-checked",String(serviceEnabled));serviceToggle.classList.toggle("review-button-deny",serviceEnabled);
    globalCooldownEnds=state.globalCooldownEnds&&new Date(state.globalCooldownEnds).getTime()>Date.now()?state.globalCooldownEnds:null;
    get("schedule-cooldown-form").hidden=staffRole!=="owner";
    get("schedule-cooldown-end").min=easternInputValue(new Date(Date.now()+60000).toISOString());
    renderGlobalCooldownState();
    renderPending(requests.find((request)=>["pending","awaiting_payment"].includes(request.status))||null);renderStaffReviewAlerts(requests);renderHistory(requests);renderHistory(archived,{containerId:"request-archive",archived:true,emptyMessage:"No requests have reached the Archive yet."});
    await refreshDiscordHealth();
  }
  async function initialize() {
    if(!client){message("Connection error","The staff service could not load.");return;}
    const {data}=await client.auth.getSession();session=data.session;if(oauthReturnPending&&session?.provider_token){providerToken=session.provider_token;window.sessionStorage.setItem("toxic-twitch-provider-token",providerToken)}window.sessionStorage.removeItem("toxic-staff-oauth-pending");get("staff-sign-in").hidden=Boolean(session);get("staff-sign-out").hidden=!session;
    if(!session){message("Staff sign-in required","Sign in with an authorized Twitch account to open the private controls.");return;}
    await verifyAutomaticStaff();
    const {data:access,error}=await client.rpc("my_request_staff_access");
    if(error){message("Staff controls unavailable","The staff access check could not be completed.");return;}
    staffAccessSource=access?.accessSource||null;staffRole=access?.role||null;
    if(!access?.isStaff||(access.accessSource==="twitch_moderator"&&!providerToken)){get("staff-sign-in").hidden=false;get("staff-sign-in").textContent="Verify moderator access";message("Moderator verification required","Sign in with Twitch again. Current channel moderators receive Staff Control automatically.");return;}
    get("staff-role").textContent=`Signed in as ${access.role==="owner"?"Owner":"Moderator"}`;await refreshDashboard();
  }

  get("staff-sign-in").addEventListener("click",signIn);get("staff-sign-out").addEventListener("click",async()=>{providerToken="";staffAccessSource=null;staffRole=null;window.sessionStorage.removeItem("toxic-twitch-provider-token");window.sessionStorage.removeItem("toxic-staff-oauth-pending");await client.auth.signOut();window.location.reload()});get("refresh-requests").addEventListener("click",refreshDashboard);
  get("refresh-discord-health").addEventListener("click",refreshDiscordHealth);
  get("test-discord-notification").addEventListener("click",()=>runDiscordHealthAction("test",get("test-discord-notification")));
  get("retry-discord-notification").addEventListener("click",()=>{if(unresolvedDiscordFailure)runDiscordHealthAction("retry",get("retry-discord-notification"),unresolvedDiscordFailure.id);});

  const serviceDialog=get("toggle-service-dialog");get("toggle-request-service").addEventListener("click",()=>{const turningOn=!serviceEnabled;get("toggle-service-error").textContent="";get("toggle-service-title").textContent=turningOn?"Turn new game requests on?":"Turn new game requests off?";get("toggle-service-copy").textContent=turningOn?"This restores new request submissions. Any active global cooldown still applies.":"This immediately blocks only new request submissions. Existing requests can still be reviewed, paid, confirmed, or expired normally.";const confirm=get("confirm-service-toggle");confirm.textContent=turningOn?"Turn Services On":"Turn Services Off";confirm.classList.toggle("review-button-deny",!turningOn);serviceDialog.showModal()});get("keep-service-state").addEventListener("click",()=>serviceDialog.close());serviceDialog.querySelector(".request-dialog-close").addEventListener("click",()=>serviceDialog.close());
  get("toggle-service-form").addEventListener("submit",async(event)=>{event.preventDefault();const nextState=!serviceEnabled;const confirm=get("confirm-service-toggle");confirm.disabled=true;const {error}=await client.rpc("set_request_service_enabled",{enabled:nextState});confirm.disabled=false;if(error){get("toggle-service-error").textContent="The service state could not be changed.";return}serviceDialog.close();await refreshDashboard()});

  get("schedule-cooldown-form").addEventListener("submit",async(event)=>{
    event.preventDefault();
    const input=get("schedule-cooldown-end");const feedback=get("schedule-cooldown-error");const button=get("schedule-global-cooldown");
    feedback.textContent="";
    if(staffRole!=="owner"){feedback.textContent="Owner access is required.";return}
    if(!input.value){feedback.textContent="Choose the Eastern date and time when requests should reopen.";return}
    button.disabled=true;
    const {error}=await client.rpc("schedule_global_request_cooldown",{cooldown_ends_local:input.value});
    button.disabled=false;
    if(error){feedback.textContent=error.message||"The scheduled cooldown could not be started.";return}
    input.value="";
    await refreshDashboard();
  });
  const resetDialog=get("reset-cooldown-dialog");get("reset-global-cooldown").addEventListener("click",()=>{get("reset-cooldown-error").textContent="";resetDialog.showModal()});get("keep-global-cooldown").addEventListener("click",()=>resetDialog.close());resetDialog.querySelector(".request-dialog-close").addEventListener("click",()=>resetDialog.close());
  get("reset-cooldown-form").addEventListener("submit",async(event)=>{event.preventDefault();const {error}=await client.rpc("reset_global_request_cooldown");if(error){get("reset-cooldown-error").textContent="The cooldown could not be reset.";return}resetDialog.close();await refreshDashboard()});

  const approveDialog=get("approve-dialog");get("approve-request").addEventListener("click",()=>{get("approve-error").textContent="";approveDialog.showModal()});get("cancel-approval").addEventListener("click",()=>approveDialog.close());approveDialog.querySelector(".request-dialog-close").addEventListener("click",()=>approveDialog.close());
  get("approve-form").addEventListener("submit",async(event)=>{event.preventDefault();if(!pendingRequest)return;const {error}=await client.rpc("staff_review_game_request",{request_id:pendingRequest.id,decision:"approve",denial_explanation:null});if(error){get("approve-error").textContent="This request could not be approved. Its status may have changed.";return}approveDialog.close();await refreshDashboard()});

  const denyDialog=get("deny-dialog");get("deny-request").addEventListener("click",()=>{get("deny-reason").value="";get("deny-error").textContent="";denyDialog.showModal();get("deny-reason").focus()});denyDialog.querySelector(".request-dialog-close").addEventListener("click",()=>denyDialog.close());
  get("deny-form").addEventListener("submit",async(event)=>{event.preventDefault();if(!pendingRequest)return;const reason=get("deny-reason").value.trim();if(!reason){get("deny-error").textContent="A denial explanation is required.";return}const {error}=await client.rpc("staff_review_game_request",{request_id:pendingRequest.id,decision:"deny",denial_explanation:reason});if(error){get("deny-error").textContent="This request could not be denied. Its status may have changed.";return}denyDialog.close();await refreshDashboard()});

  const cancelAwaitingDialog=get("cancel-awaiting-dialog");get("cancel-awaiting-request").addEventListener("click",()=>{get("cancel-awaiting-reason").value="";get("cancel-awaiting-error").textContent="";cancelAwaitingDialog.showModal();get("cancel-awaiting-reason").focus()});cancelAwaitingDialog.querySelector(".request-dialog-close").addEventListener("click",()=>cancelAwaitingDialog.close());
  get("cancel-awaiting-form").addEventListener("submit",async(event)=>{event.preventDefault();if(!pendingRequest||pendingRequest.status!=="awaiting_payment")return;const reason=get("cancel-awaiting-reason").value.trim();if(!reason){get("cancel-awaiting-error").textContent="A cancellation explanation is required.";return}const {error}=await client.rpc("staff_cancel_awaiting_request",{request_id:pendingRequest.id,cancellation_explanation:reason});if(error){get("cancel-awaiting-error").textContent="This awaiting request could not be cancelled. Its status may have changed.";return}cancelAwaitingDialog.close();await refreshDashboard()});

  const editDialog=get("edit-request-dialog");get("edit-request").addEventListener("click",()=>openEditDialog(pendingRequest));get("apply-viewer-change").addEventListener("click",()=>openEditDialog(pendingRequest,true));get("deny-viewer-change").addEventListener("click",()=>openViewerChangeDenyDialog(pendingRequest));get("cancel-request-edit").addEventListener("click",()=>editDialog.close());editDialog.querySelector(".request-dialog-close").addEventListener("click",()=>editDialog.close());
  get("edit-request-form").addEventListener("submit",async(event)=>{
    event.preventDefault();
    if(!canEditRequest(editRequest)){get("edit-request-error").textContent="This request can no longer be edited.";return;}
    const catalogRequest=editRequest.request_type==="catalog";const catalogSelection=catalogRequest?editGamePicker?.selected():null;
    const title=catalogSelection?.title||get("edit-game-title").value.trim();const platform=catalogSelection?.systemLabel||get("edit-platform").value.trim();const reason=get("edit-reason").value.trim();
    if(catalogRequest&&!catalogSelection){get("edit-request-error").textContent="Select an owned game from the catalog suggestions.";return;}
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

  const denyViewerChangeDialog=get("deny-viewer-change-dialog");denyViewerChangeDialog.querySelector(".request-dialog-close").addEventListener("click",()=>denyViewerChangeDialog.close());
  get("deny-viewer-change-form").addEventListener("submit",async(event)=>{
    event.preventDefault();
    if(!hasPendingViewerChange(viewerChangeReviewRequest)){denyViewerChangeDialog.close();await refreshDashboard();return;}
    const reason=get("deny-viewer-change-reason").value.trim();
    if(reason.length<10){get("deny-viewer-change-error").textContent="Explain the denial in at least 10 characters.";return;}
    const confirm=get("confirm-viewer-change-denial");confirm.disabled=true;
    const {error}=await client.rpc("staff_deny_game_change_request",{request_id:viewerChangeReviewRequest.id,denial_explanation:reason});
    confirm.disabled=false;
    if(error){get("deny-viewer-change-error").textContent=error.message||"This game change request could not be denied.";return;}
    denyViewerChangeDialog.close();viewerChangeReviewRequest=null;await refreshDashboard();
  });

  const scheduleDialog=get("schedule-dialog");scheduleDialog.querySelector(".request-dialog-close").addEventListener("click",()=>scheduleDialog.close());
  get("schedule-form").addEventListener("submit",async(event)=>{
    event.preventDefault();if(!scheduleRequest)return;
    const localValue=get("schedule-local").value;
    const reason=get("schedule-reason").value.trim();
    const summary=get("schedule-game-summary").value.trim();
    const releaseYear=Number(get("schedule-release-year").value);
    if(!localValue){get("schedule-error").textContent="Choose an Eastern date and time.";return;}
    if(!Number.isInteger(releaseYear)||releaseYear<1950||releaseYear>2100){get("schedule-error").textContent="Add a valid four-digit release year.";return;}
    if(summary.length<30){get("schedule-error").textContent="Add a public game summary of at least 30 characters.";return;}
    if(scheduleRequest.scheduled_for&&!reason&&localValue!==easternInputValue(scheduleRequest.scheduled_for)){get("schedule-error").textContent="Explain why the scheduled time is changing.";return;}
    const save=get("save-schedule");save.disabled=true;
    const {error}=await client.rpc("staff_schedule_game_request",{
      request_id:scheduleRequest.id,
      scheduled_local:localValue,
      schedule_explanation:reason||null,
      game_summary_text:summary,
      release_year_value:releaseYear
    });
    save.disabled=false;
    if(error){
      get("schedule-error").textContent=error.message?.includes("future")?"Choose a date and time in the future.":error.message?.includes("summary")?"Add a public game summary of at least 30 characters.":error.message?.includes("release year")?"Add a valid four-digit release year.":error.message?.includes("explanation")?"Explain why the scheduled time is changing.":"This schedule could not be saved. Confirm that payment is complete.";
      return;
    }
    scheduleDialog.close();await refreshDashboard();
  });
  get("clear-schedule").addEventListener("click",async()=>{if(!scheduleRequest)return;const reason=get("schedule-reason").value.trim();if(!reason){get("schedule-error").textContent="Explain why the scheduled time is being cleared.";return}const button=get("clear-schedule");button.disabled=true;const {error}=await client.rpc("staff_schedule_game_request",{request_id:scheduleRequest.id,scheduled_local:null,schedule_explanation:reason});button.disabled=false;if(error){get("schedule-error").textContent=error.message?.includes("explanation")?"Explain why the scheduled time is being cleared.":"This schedule could not be cleared.";return}scheduleDialog.close();await refreshDashboard()});

  const completionDialog=get("completion-dialog");completionDialog.querySelector(".request-dialog-close").addEventListener("click",()=>completionDialog.close());get("cancel-completion").addEventListener("click",()=>completionDialog.close());
  get("completion-find-vods").addEventListener("click",async()=>{
    if(!completionRequest)return;
    const button=get("completion-find-vods");const status=get("completion-lookup-status");
    button.disabled=true;button.textContent="Searching…";status.textContent="Checking your latest completed streams…";
    const {data,error}=await client.functions.invoke("find-latest-vods",{body:{requestId:completionRequest.id}});
    button.disabled=false;button.textContent="Find Latest VODs";
    if(error||data?.error){status.textContent=data?.error||"The VOD lookup could not be completed. Check its Edge Function and secrets.";return;}
    if(data?.youtube?.url)get("completion-youtube").value=data.youtube.url;
    if(data?.twitch?.url)get("completion-twitch").value=data.twitch.url;
    updateCompletionViewLinks();
    const found=[data?.twitch?"Twitch: "+data.twitch.title:"",data?.youtube?"YouTube: "+data.youtube.title:""].filter(Boolean);
    const warnings=Array.isArray(data?.warnings)?data.warnings:[];
    status.textContent=found.length?`Found ${found.join(" · ")}. Confirm the links before publishing.${warnings.length?` ${warnings.join(" · ")}`:""}`:warnings.join(" · ")||"No recent VODs were found yet. Wait for processing, then try again.";
  });
  get("completion-youtube").addEventListener("input",updateCompletionViewLinks);get("completion-twitch").addEventListener("input",updateCompletionViewLinks);
  get("completion-form").addEventListener("submit",async(event)=>{
    event.preventDefault();if(!completionRequest)return;
    const completedLocal=get("completion-local").value;const twitchInput=get("completion-twitch").value.trim();const youtubeInput=get("completion-youtube").value.trim();
    if(!completedLocal){get("completion-error").textContent="Choose the completed Eastern date and time.";return;}
    let twitchUrl=null;let youtubeUrl=null;
    try{
      if(twitchInput)twitchUrl=normalizeVodUrl(twitchInput,"twitch");
      if(youtubeInput)youtubeUrl=normalizeVodUrl(youtubeInput,"youtube");
      if(!twitchUrl&&!youtubeUrl)throw new Error("Add at least one valid Twitch or YouTube VOD link.");
    }
    catch(error){get("completion-error").textContent=error.message||"Check the VOD links and try again.";return;}
    const save=get("save-completion");save.disabled=true;
    const {error}=await client.rpc("staff_complete_game_request",{request_id:completionRequest.id,completed_local:completedLocal,youtube_vod:youtubeUrl,twitch_vod:twitchUrl});
    save.disabled=false;
    if(error){get("completion-error").textContent=error.message||"This requested stream could not be completed.";return;}
    completionDialog.close();completionRequest=null;await refreshDashboard();
  });

  if(client)client.auth.onAuthStateChange((event,nextSession)=>{if(oauthReturnPending&&nextSession?.provider_token){providerToken=nextSession.provider_token;window.sessionStorage.setItem("toxic-twitch-provider-token",providerToken)}if(event==="SIGNED_OUT"){providerToken="";window.sessionStorage.removeItem("toxic-twitch-provider-token")}});
  setupStaffTabs();initialize();
  window.setInterval(()=>{if(document.hidden||!globalCooldownEnds)return;if(new Date(globalCooldownEnds).getTime()<=Date.now()){globalCooldownEnds=null;refreshDashboard();return}renderGlobalCooldownState()},1000);
  window.setInterval(async()=>{if(providerToken&&!document.hidden){const verified=await verifyAutomaticStaff();if(verified&&verified.isStaff===false){message("Moderator access ended","Twitch no longer lists this account as a moderator for this channel.");}}},55*60*1000);
  document.addEventListener("visibilitychange",async()=>{if(!document.hidden&&providerToken&&staffAccessSource==="twitch_moderator"){const verified=await verifyAutomaticStaff();if(verified&&verified.isStaff===false){providerToken="";window.sessionStorage.removeItem("toxic-twitch-provider-token");get("staff-sign-in").hidden=false;get("staff-sign-in").textContent="Verify moderator access";message("Moderator access ended","Twitch no longer lists this account as a moderator for this channel.");}}});
  window.addEventListener("pageshow",(event)=>{if(event.persisted&&staffAccessSource==="twitch_moderator"){providerToken="";window.sessionStorage.removeItem("toxic-twitch-provider-token");get("staff-sign-in").hidden=false;get("staff-sign-in").textContent="Verify moderator access";message("Moderator verification required","You left Staff Control. Sign in with Twitch again to re-establish moderator access.");}});
})();
