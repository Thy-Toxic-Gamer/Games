(function () {
  "use strict";
  const client=window.toxicSupabase;
  const panel=document.querySelector("#completed-requests-panel");
  const grid=document.querySelector("#completed-requests-grid");
  const easternZone="America/New_York";
  const requestGoalLabels={play:"Play Game",speed_run:"Speed Run Game",completion:"100% Completion"};

  if(!panel||!grid)return;

  function make(tag,className,text){const node=document.createElement(tag);if(className)node.className=className;if(text!==undefined)node.textContent=text;return node;}
  function completedDate(value){return new Intl.DateTimeFormat("en-US",{timeZone:easternZone,year:"numeric",month:"long",day:"numeric"}).format(new Date(value));}
  function safeVodLink(label,url,className){const link=make("a",`completed-vod-link ${className}`,label);link.href=url;link.target="_blank";link.rel="noopener noreferrer";return link;}
  function render(items){
    grid.replaceChildren();
    const streams=Array.isArray(items)?items:[];
    const tab=document.querySelector('[data-platform="completed"] .tab-count');if(tab)tab.textContent=String(streams.length);
    if(!streams.length){grid.append(make("p","completed-requests-empty","No completed requested streams have been published yet."));return;}
    streams.forEach((stream)=>{
      const card=make("article","completed-request-card");
      card.append(make("p","eyebrow","Requested Stream"),make("h4",null,stream.gameTitle),make("p","completed-request-meta",`${stream.platform||"System not specified"} · ${requestGoalLabels[stream.requestGoal]||"Play Game"}`),make("p","completed-request-date",`Completed ${completedDate(stream.completedAt)}`));
      const links=make("p","completed-request-links");links.append(safeVodLink("Watch on YouTube",stream.youtubeUrl,"vod-youtube"));
      if(stream.twitchUrl){links.append(document.createTextNode(" · "),safeVodLink("Watch on Twitch",stream.twitchUrl,"vod-twitch"));}
      card.append(links);grid.append(card);
    });
  }
  async function load(){
    if(!client){render([]);return;}
    const {data,error}=await client.rpc("completed_public_game_requests",{limit_count:48});
    render(error?[]:data);
  }
  window.setInterval(()=>{if(!document.hidden)load();},5*60*1000);
  document.addEventListener("visibilitychange",()=>{if(!document.hidden)load();});
  load();
})();
