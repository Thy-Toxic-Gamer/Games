(function(){
  "use strict";
  const KEY="toxicGameRequestTestV1";
  const get=(id)=>document.getElementById(id);
  const read=()=>{try{return JSON.parse(localStorage.getItem(KEY))||null}catch{return null}};
  const save=(value)=>localStorage.setItem(KEY,JSON.stringify(value));
  const labels={pending:"Pending Review",awaiting_payment:"Approved · Awaiting Test Payment",approved:"Paid & Approved · Cooldown Active",denied:"Denied",expired:"Expired",cancelled:"Cancelled by Viewer"};
  function render(){
    const request=read(); get("review-empty").hidden=Boolean(request); get("review-card").hidden=!request;
    if(!request)return;
    get("review-id").textContent=request.id; get("review-title").textContent=request.gameTitle; get("review-platform").textContent=request.platform;
    get("review-viewer").textContent=request.twitchName; get("review-time").textContent=new Date(request.createdAt).toLocaleString(); get("review-note").textContent=request.note||"No note provided.";
    get("review-status").textContent=labels[request.status]||request.status; get("review-status").dataset.status=request.status;
    const decision=[]; if(request.denialReason)decision.push(`Denied: ${request.denialReason}`); if(request.paymentDeadline)decision.push(`Payment deadline: ${new Date(request.paymentDeadline).toLocaleString()}`); if(request.cooldownEnds)decision.push(`Cooldown ends: ${new Date(request.cooldownEnds).toLocaleString()}`);
    get("review-decision").textContent=decision.join(" · ")||"No decision recorded yet.";
    get("preapprove-button").hidden=request.status!=="pending"; get("deny-button").hidden=request.status!=="pending"; get("payment-button").hidden=request.status!=="awaiting_payment";
  }
  get("preapprove-button").addEventListener("click",()=>{const r=read();if(!r||r.status!=="pending")return;r.status="awaiting_payment";r.preapprovedAt=new Date().toISOString();r.paymentDeadline=new Date(Date.now()+48*60*60*1000).toISOString();save(r);render()});
  const denyDialog=get("deny-dialog"); get("deny-button").addEventListener("click",()=>{get("deny-reason").value="";get("deny-error").textContent="";denyDialog.showModal();get("deny-reason").focus()});
  denyDialog.querySelector(".request-dialog-close").addEventListener("click",()=>denyDialog.close());
  get("deny-form").addEventListener("submit",(event)=>{event.preventDefault();const reason=get("deny-reason").value.trim();if(!reason){get("deny-error").textContent="A denial explanation is required.";return}const r=read();if(!r||r.status!=="pending")return;r.status="denied";r.denialReason=reason;r.deniedAt=new Date().toISOString();save(r);denyDialog.close();render()});
  get("payment-button").addEventListener("click",()=>{const r=read();if(!r||r.status!=="awaiting_payment")return;const now=new Date();r.status="approved";r.paidAt=now.toISOString();r.approvedAt=now.toISOString();r.cooldownEnds=new Date(now.getTime()+14*24*60*60*1000).toISOString();save(r);render()});
  get("reset-button").addEventListener("click",()=>{localStorage.removeItem(KEY);render()});
  window.addEventListener("storage",render);render();
})();
