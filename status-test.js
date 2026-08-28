(function(){
  "use strict";
  const KEY="toxicGameRequestTestV1",get=(id)=>document.getElementById(id);
  const read=()=>{try{return JSON.parse(localStorage.getItem(KEY))||null}catch{return null}};
  const labels={pending:"Pending Review",awaiting_payment:"Awaiting Payment",approved:"Approved",denied:"Denied",expired:"Expired"};
  const messages={pending:"Your game request is waiting for review. No payment is requested yet.",awaiting_payment:"Your request was pre-approved. In the final system, the secure payment button and 48-hour deadline will appear here.",approved:"Your test payment was confirmed and the request is approved. The 14-day viewer cooldown is active.",denied:"Your request was denied. The explanation is recorded below, and the viewer request slot is open again.",expired:"The payment reservation expired and the viewer request slot reopened."};
  function render(){const r=read();get("status-empty").hidden=Boolean(r);get("status-card").hidden=!r;if(!r)return;get("status-id").textContent=r.id;get("status-title").textContent=r.gameTitle;get("status-platform").textContent=r.platform;get("status-viewer").textContent=r.twitchName;get("status-time").textContent=new Date(r.createdAt).toLocaleString();get("status-state").textContent=labels[r.status]||r.status;get("status-state").dataset.status=r.status;get("status-message").textContent=messages[r.status]||"Request status updated.";get("status-reason-row").hidden=!r.denialReason;get("status-reason").textContent=r.denialReason||"";get("status-deadline-row").hidden=!r.paymentDeadline||r.status!=="awaiting_payment";get("status-deadline").textContent=r.paymentDeadline?new Date(r.paymentDeadline).toLocaleString():""}
  window.addEventListener("storage",render);render();
})();
