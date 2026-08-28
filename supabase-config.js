(function () {
  "use strict";
  const projectUrl = "https://piphqjpdjgbnikcjdkip.supabase.co";
  const publishableKey = "sb_publishable_m1iwG4M260O8m3FX7m_K_g_QdjVFmtI";
  if (!window.supabase?.createClient) { console.error("Supabase browser client did not load."); return; }
  window.toxicSupabase = window.supabase.createClient(projectUrl, publishableKey, {
    auth: { persistSession:true, autoRefreshToken:true, detectSessionInUrl:true }
  });
})();
