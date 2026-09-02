(function () {
  "use strict";
  const projectUrl = "https://hdwhhyrlmktiynyujozk.supabase.co";
  const publishableKey = "sb_publishable_JiZipr3WJnP1XoKvibaNrw_PtU2H4kW";
  if (!window.supabase?.createClient) { console.error("Supabase browser client did not load."); return; }
  window.toxicSupabase = window.supabase.createClient(projectUrl, publishableKey, {
    auth: { persistSession:true, autoRefreshToken:true, detectSessionInUrl:true }
  });
})();
