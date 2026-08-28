import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

type StreamElementsTip = {
  _id?: string;
  id?: string;
  provider?: string;
  status?: string;
  approved?: string;
  createdAt?: string;
  donation?: {
    message?: string;
    amount?: number;
    currency?: string;
    paymentMethod?: string;
  };
};

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

Deno.serve(async (request) => {
  if (request.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (request.method !== "POST") return json({ error: "Method not allowed" }, 405);

  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const anonKey = Deno.env.get("SUPABASE_ANON_KEY");
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  const accountId = Deno.env.get("STREAMELEMENTS_ACCOUNT_ID");
  const streamElementsJwt = Deno.env.get("STREAMELEMENTS_JWT");
  const authorization = request.headers.get("Authorization");

  if (!supabaseUrl || !anonKey || !serviceRoleKey || !accountId || !streamElementsJwt) {
    return json({ error: "Payment service is not configured" }, 503);
  }
  if (!authorization) return json({ error: "Authentication required" }, 401);

  const viewerClient = createClient(supabaseUrl, anonKey, {
    global: { headers: { Authorization: authorization } },
  });
  const { data: userData, error: userError } = await viewerClient.auth.getUser();
  if (userError || !userData.user) return json({ error: "Invalid session" }, 401);

  const payload = await request.json().catch(() => ({}));
  const requestId = typeof payload.requestId === "string" ? payload.requestId : "";
  if (!requestId) return json({ error: "Request ID is required" }, 400);

  const admin = createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const { data: gameRequest, error: requestError } = await admin
    .from("game_requests")
    .select("id,viewer_id,status,minimum_amount,payment_reference,payment_deadline,created_at")
    .eq("id", requestId)
    .eq("viewer_id", userData.user.id)
    .maybeSingle();

  if (requestError) return json({ error: "Request lookup failed" }, 500);
  if (!gameRequest) return json({ error: "Request not found" }, 404);
  if (gameRequest.status !== "awaiting_payment") return json({ status: gameRequest.status });

  if (gameRequest.payment_deadline && new Date(gameRequest.payment_deadline).getTime() <= Date.now()) {
    await admin.from("game_requests").update({ status: "expired" })
      .eq("id", gameRequest.id).eq("status", "awaiting_payment");
    return json({ status: "expired" });
  }

  const tipsResponse = await fetch(
    `https://api.streamelements.com/kappa/v2/tips/${encodeURIComponent(accountId)}?limit=100`,
    { headers: { Authorization: `Bearer ${streamElementsJwt}`, Accept: "application/json" } },
  );
  if (!tipsResponse.ok) return json({ error: "StreamElements lookup failed" }, 502);

  const tipsPayload = await tipsResponse.json();
  const tips: StreamElementsTip[] = Array.isArray(tipsPayload)
    ? tipsPayload
    : Array.isArray(tipsPayload?.docs) ? tipsPayload.docs : [];
  const reference = String(gameRequest.payment_reference || "").toUpperCase();
  const minimum = Number(gameRequest.minimum_amount);
  const requestCreated = new Date(gameRequest.created_at).getTime();

  const match = tips.find((tip) => {
    const message = String(tip.donation?.message || "").toUpperCase();
    const amount = Number(tip.donation?.amount);
    const created = tip.createdAt ? new Date(tip.createdAt).getTime() : 0;
    const successful = String(tip.status || "").toLowerCase() === "success";
    const notRejected = String(tip.approved || "").toLowerCase() !== "rejected";
    return reference && message.includes(reference) && amount >= minimum &&
      created >= requestCreated && successful && notRejected;
  });

  if (!match) return json({ status: "awaiting_payment" });
  const tipId = match._id || match.id;
  if (!tipId) return json({ error: "StreamElements returned an invalid tip" }, 502);

  const { data: updated, error: updateError } = await admin
    .from("game_requests")
    .update({
      status: "approved",
      streamelements_tip_id: tipId,
      payment_provider: match.provider || match.donation?.paymentMethod || "streamelements",
      payment_currency: match.donation?.currency || "USD",
      payment_amount: Number(match.donation?.amount),
      paid_at: new Date().toISOString(),
    })
    .eq("id", gameRequest.id)
    .eq("status", "awaiting_payment")
    .is("streamelements_tip_id", null)
    .select("status")
    .maybeSingle();

  if (updateError) {
    if (updateError.code === "23505") return json({ error: "This tip was already used" }, 409);
    return json({ error: "Payment confirmation failed" }, 500);
  }
  return json({ status: updated?.status || "approved" });
});

