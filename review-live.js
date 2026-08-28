(function () {
  "use strict";
  const client = window.toxicSupabase;
  const get = (id) => document.getElementById(id);
  let session = null;
  function authRedirect() { return new URL("review.html", window.location.href).href; }
  function message(title,copy) { get("staff-message").hidden=false;get("staff-panel").hidden=true;get("staff-message-title").textContent=title;get("staff-message-copy").textContent=copy; }
  async function signIn() { await client.auth.signInWithOAuth({provider:"twitch",options:{redirectTo:authRedirect()}}); }
  async function refreshPanel() {
    if (!session?.user) { message("Staff sign-in required","Sign in with an authorized Twitch account to open the private controls."); return; }
    const {data:access,error:accessError} = await client.rpc("my_request_staff_access");
    if (accessError) { message("Staff controls unavailable","The staff access check could not be completed."); return; }
    if (!access?.isStaff) { message("Access denied","This Twitch account has not been assigned as the owner or authorized staff."); return; }
    const {data:state,error:stateError} = await client.rpc("request_system_state");
    if (stateError) { message("Cooldown unavailable","The global cooldown status could not be loaded."); return; }
    get("staff-message").hidden=true;get("staff-panel").hidden=false;
    get("staff-role").textContent = `Signed in as ${access.role === "owner" ? "Owner" : "Moderator"}`;
    const active = state.globalCooldownEnds && new Date(state.globalCooldownEnds).getTime() > Date.now();
    get("global-cooldown-state").textContent = active ? "Cooldown Active" : "Requests Open";
    get("global-cooldown-state").dataset.status = active ? "denied" : "approved";
    get("global-cooldown-message").textContent = active ? `Requests are closed until ${new Date(state.globalCooldownEnds).toLocaleString()}, unless staff resets the cooldown early.` : "There is no active global cooldown. Viewers can submit a game request.";
    get("reset-global-cooldown").disabled = !active;
  }
  get("staff-sign-in").addEventListener("click",signIn);
  get("staff-sign-out").addEventListener("click",async()=>{await client.auth.signOut();window.location.reload()});
  const resetDialog = get("reset-cooldown-dialog");
  get("reset-global-cooldown").addEventListener("click",()=>{get("reset-cooldown-error").textContent="";resetDialog.showModal()});
  get("keep-global-cooldown").addEventListener("click",()=>resetDialog.close());
  resetDialog.querySelector(".request-dialog-close").addEventListener("click",()=>resetDialog.close());
  get("reset-cooldown-form").addEventListener("submit",async(event)=>{
    event.preventDefault();
    const {error} = await client.rpc("reset_global_request_cooldown");
    if (error) { get("reset-cooldown-error").textContent="The cooldown could not be reset. Confirm that this Twitch account has staff access."; return; }
    resetDialog.close(); await refreshPanel();
  });
  async function initialize() {
    if (!client) { message("Connection error","The staff service could not load."); return; }
    const {data} = await client.auth.getSession(); session=data.session;
    get("staff-sign-in").hidden=Boolean(session);get("staff-sign-out").hidden=!session;
    await refreshPanel();
  }
  initialize();
})();
