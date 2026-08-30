import { createClient } from "npm:@supabase/supabase-js@2";

const allowedOrigin = Deno.env.get("SITE_ORIGIN") ?? "https://thy-toxic-gamer.github.io";
const corsHeaders = {
  "Access-Control-Allow-Origin": allowedOrigin,
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Vary": "Origin",
};

type DeliveryLog = {
  id: string;
  event_type: string;
  request_id: string | null;
  target: string;
  webhook_key: string;
  status: "success" | "failed";
  http_status: number | null;
  error_message: string | null;
  payload?: Record<string, unknown> | null;
  delivered_at: string | null;
  retry_of: string | null;
  resolved_at: string | null;
  created_at: string;
};

const webhookEnvironmentNames: Record<string, string> = {
  pending: "DISCORD_PENDING_WEBHOOK",
  awaiting_payment: "DISCORD_AWAITING_PAYMENT_WEBHOOK",
  approved: "DISCORD_APPROVED_WEBHOOK",
  denied: "DISCORD_DENIED_WEBHOOK",
  cancelled: "DISCORD_CANCELLED_WEBHOOK",
  expired: "DISCORD_EXPIRED_WEBHOOK",
  schedule: "DISCORD_SCHEDULE_WEBHOOK",
  system: "DISCORD_SYSTEM_LOG_WEBHOOK_URL",
};

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

function safeLog(log: DeliveryLog) {
  return {
    id: log.id,
    eventType: log.event_type,
    requestId: log.request_id,
    target: log.target,
    status: log.status,
    httpStatus: log.http_status,
    errorMessage: log.error_message,
    deliveredAt: log.delivered_at,
    retryOf: log.retry_of,
    resolvedAt: log.resolved_at,
    createdAt: log.created_at,
  };
}

async function recentHealth(admin: ReturnType<typeof createClient>) {
  const { data, error } = await admin
    .from("discord_notification_logs")
    .select("id,event_type,request_id,target,webhook_key,status,http_status,error_message,delivered_at,retry_of,resolved_at,created_at")
    .order("created_at", { ascending: false })
    .limit(20);
  if (error) throw error;
  const logs = (data ?? []) as DeliveryLog[];
  return {
    configured: Boolean(Deno.env.get("DISCORD_SYSTEM_LOG_WEBHOOK_URL")),
    lastSuccess: logs.find((item) => item.status === "success") ? safeLog(logs.find((item) => item.status === "success") as DeliveryLog) : null,
    lastFailure: logs.find((item) => item.status === "failed") ? safeLog(logs.find((item) => item.status === "failed") as DeliveryLog) : null,
    unresolvedFailure: logs.find((item) => item.status === "failed" && !item.resolved_at) ? safeLog(logs.find((item) => item.status === "failed" && !item.resolved_at) as DeliveryLog) : null,
    logs: logs.map(safeLog),
  };
}

async function recordDelivery(
  admin: ReturnType<typeof createClient>,
  values: Record<string, unknown>,
) {
  const { data, error } = await admin
    .from("discord_notification_logs")
    .insert(values)
    .select("id")
    .single();
  if (error) throw error;
  return data.id as string;
}

async function deliver(webhook: string, payload: Record<string, unknown>) {
  try {
    const response = await fetch(webhook, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const detail = response.ok ? "" : (await response.text().catch(() => "")).slice(0, 500);
    return { ok: response.ok, status: response.status, error: detail || (response.ok ? null : `Discord returned ${response.status}`) };
  } catch (error) {
    return { ok: false, status: null, error: error instanceof Error ? error.message.slice(0, 500) : "Discord request failed" };
  }
}

Deno.serve(async (request) => {
  if (request.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (request.method !== "POST") return json({ error: "Method not allowed" }, 405);

  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const anonKey = Deno.env.get("SUPABASE_ANON_KEY");
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  const authorization = request.headers.get("Authorization");
  if (!supabaseUrl || !anonKey || !serviceRoleKey) return json({ error: "Health service is not configured" }, 503);
  if (!authorization) return json({ error: "Authentication required" }, 401);

  const caller = createClient(supabaseUrl, anonKey, {
    global: { headers: { Authorization: authorization } },
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const [{ data: userData, error: userError }, { data: access, error: accessError }] = await Promise.all([
    caller.auth.getUser(),
    caller.rpc("my_request_staff_access"),
  ]);
  if (userError || !userData.user) return json({ error: "Invalid Supabase session" }, 401);
  if (accessError || !access?.isStaff || !access?.canReview) return json({ error: "Verified staff access required" }, 403);

  const admin = createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const payload = await request.json().catch(() => ({}));
  const action = typeof payload.action === "string" ? payload.action : "status";

  // Keep the operational log useful without retaining delivery payloads forever.
  const cutoff = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString();
  await admin.from("discord_notification_logs").delete().lt("created_at", cutoff);

  if (action === "status") {
    try { return json(await recentHealth(admin)); }
    catch (error) {
      console.error("Discord health lookup failed", error);
      return json({ error: "Discord delivery history is unavailable" }, 500);
    }
  }

  if (action === "test") {
    const webhook = Deno.env.get("DISCORD_SYSTEM_LOG_WEBHOOK_URL");
    if (!webhook) return json({ error: "The system-log webhook secret is missing" }, 503);
    const now = new Date().toISOString();
    const body = {
      username: "ThyToxicBot System Health",
      allowed_mentions: { parse: [] },
      embeds: [{
        title: "✅ Discord Health Test",
        description: "Staff Control successfully reached the private request-system log channel.",
        color: 0x7cff00,
        fields: [
          { name: "Started By", value: access.role === "owner" ? "Owner" : "Verified Moderator", inline: true },
          { name: "Status", value: "Connected", inline: true },
        ],
        timestamp: now,
        footer: { text: "ThyToxicGamer Request System" },
      }],
    };
    const result = await deliver(webhook, body);
    await recordDelivery(admin, {
      event_type: "system_test",
      target: "request-system-logs",
      webhook_key: "system",
      status: result.ok ? "success" : "failed",
      http_status: result.status,
      error_message: result.error,
      payload: result.ok ? null : body,
      delivered_at: result.ok ? now : null,
    });
    if (!result.ok) return json({ error: result.error ?? "Discord test failed" }, 502);
    return json({ delivered: true, health: await recentHealth(admin) });
  }

  if (action === "retry") {
    const logId = typeof payload.logId === "string" ? payload.logId.trim() : "";
    if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(logId)) {
      return json({ error: "A valid failed-delivery ID is required" }, 400);
    }
    const { data: failed, error } = await admin
      .from("discord_notification_logs")
      .select("*")
      .eq("id", logId)
      .eq("status", "failed")
      .is("resolved_at", null)
      .maybeSingle();
    if (error) return json({ error: "The failed delivery could not be loaded" }, 500);
    if (!failed?.payload) return json({ error: "This failure is no longer available for retry" }, 404);
    const environmentName = webhookEnvironmentNames[failed.webhook_key];
    const fallbackName = failed.webhook_key === "schedule" ? "DISCORD_APPROVED_WEBHOOK" : "";
    const webhook = environmentName ? Deno.env.get(environmentName) ?? (fallbackName ? Deno.env.get(fallbackName) : undefined) : undefined;
    if (!webhook) return json({ error: "The required Discord webhook secret is missing" }, 503);

    const now = new Date().toISOString();
    const result = await deliver(webhook, failed.payload as Record<string, unknown>);
    await recordDelivery(admin, {
      event_type: failed.event_type,
      request_id: failed.request_id,
      target: failed.target,
      webhook_key: failed.webhook_key,
      status: result.ok ? "success" : "failed",
      http_status: result.status,
      error_message: result.error,
      payload: result.ok ? null : failed.payload,
      delivered_at: result.ok ? now : null,
      retry_of: failed.id,
    });
    if (result.ok) {
      await admin.from("discord_notification_logs").update({ resolved_at: now, resolved_by: userData.user.id, payload: null }).eq("id", failed.id);
      return json({ delivered: true, health: await recentHealth(admin) });
    }
    return json({ error: result.error ?? "Discord retry failed" }, 502);
  }

  return json({ error: "Unknown health action" }, 400);
});
