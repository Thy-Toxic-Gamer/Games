import { createClient } from "npm:@supabase/supabase-js@2";

type GameRequest = {
  id: string;
  status: string;
  is_test: boolean;
  game_title: string;
  twitch_name: string;
  request_type: string;
  request_goal: string | null;
  minimum_amount: number;
  platform: string | null;
  viewer_note: string | null;
  denial_reason: string | null;
  cancellation_reason: string | null;
  scheduled_for: string | null;
  schedule_change_reason: string | null;
  previous_game_title: string | null;
  previous_platform: string | null;
  request_change_reason: string | null;
  request_changed_at: string | null;
  viewer_change_status: string | null;
  viewer_change_game_title: string | null;
  viewer_change_platform: string | null;
  viewer_change_reason: string | null;
  viewer_change_requested_at: string | null;
  viewer_change_reviewed_at: string | null;
  viewer_change_decision_reason: string | null;
  completed_at: string | null;
  youtube_vod_url: string | null;
  twitch_vod_url: string | null;
  twitch_vod_expires_at: string | null;
  created_at: string;
};

type WebhookPayload = {
  type: "INSERT" | "UPDATE" | "DELETE";
  table: string;
  schema: string;
  record: GameRequest | null;
  old_record: GameRequest | null;
};

const staffPage = "https://thy-toxic-gamer.github.io/Games/review.html";
const shorten = (value: unknown, maximum = 1000) => {
  const valueText = String(value ?? "").trim();
  return valueText ? valueText.slice(0, maximum) : "Not provided";
};
const requestGoalLabel = (value: string | null) => ({
  play: "Play Game",
  speed_run: "Speed Run Game",
  completion: "100% Completion",
})[value || "play"] || "Play Game";
const formatEastern = (value: string) => new Intl.DateTimeFormat("en-US", {
  timeZone: "America/New_York",
  weekday: "long",
  year: "numeric",
  month: "long",
  day: "numeric",
  hour: "numeric",
  minute: "2-digit",
  timeZoneName: "short",
}).format(new Date(value));

Deno.serve(async (request) => {
  if (request.method !== "POST") return Response.json({ error: "Method not allowed" }, { status: 405 });
  const expectedToken = Deno.env.get("DATABASE_WEBHOOK_SECRET");
  const suppliedToken = request.headers.get("x-webhook-token");
  if (!expectedToken || suppliedToken !== expectedToken) return Response.json({ error: "Unauthorized webhook request" }, { status: 401 });

  let payload: WebhookPayload;
  try { payload = await request.json(); }
  catch { return Response.json({ error: "Invalid JSON payload" }, { status: 400 }); }

  const gameRequest = payload.record;
  const previous = payload.old_record;
  if (payload.schema !== "public" || payload.table !== "game_requests" || !gameRequest) return Response.json({ ignored: true });

  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  const admin = supabaseUrl && serviceRoleKey
    ? createClient(supabaseUrl, serviceRoleKey, { auth: { persistSession: false, autoRefreshToken: false } })
    : null;
  const recordDelivery = async (values: Record<string, unknown>) => {
    if (!admin) return;
    const { error } = await admin.from("discord_notification_logs").insert(values);
    if (error) console.error("Discord delivery log could not be saved", error);
  };

  const isNewPending = payload.type === "INSERT" && gameRequest.status === "pending";
  const isAwaitingPayment = payload.type === "UPDATE" && gameRequest.status === "awaiting_payment" && previous?.status !== "awaiting_payment";
  const isNewApproval = payload.type === "UPDATE" && gameRequest.status === "approved" && previous?.status !== "approved";
  const isNewCompletion = payload.type === "UPDATE" && Boolean(gameRequest.completed_at) && !previous?.completed_at;
  const isNewDenial = payload.type === "UPDATE" && gameRequest.status === "denied" && previous?.status !== "denied";
  const isNewCancellation = payload.type === "UPDATE" && gameRequest.status === "cancelled" && previous?.status !== "cancelled";
  const isNewExpiration = payload.type === "UPDATE" && gameRequest.status === "expired" && previous?.status !== "expired";
  const isNewSchedule = payload.type === "UPDATE" && gameRequest.status === "approved" && Boolean(gameRequest.scheduled_for) && gameRequest.scheduled_for !== previous?.scheduled_for;
  const isScheduleCleared = payload.type === "UPDATE" && gameRequest.status === "approved" && !gameRequest.scheduled_for && Boolean(previous?.scheduled_for);
  const isRequestUpdated = payload.type === "UPDATE"
    && ["pending", "awaiting_payment", "approved"].includes(gameRequest.status)
    && (gameRequest.game_title !== previous?.game_title || gameRequest.platform !== previous?.platform);
  const isViewerChangeRequested = payload.type === "UPDATE"
    && gameRequest.viewer_change_status === "pending"
    && (previous?.viewer_change_status !== "pending"
      || gameRequest.viewer_change_game_title !== previous?.viewer_change_game_title
      || gameRequest.viewer_change_platform !== previous?.viewer_change_platform);
  const isViewerChangeDenied = payload.type === "UPDATE"
    && gameRequest.viewer_change_status === "denied"
    && previous?.viewer_change_status !== "denied";

  let webhook: string | undefined;
  let title = "";
  let description = "";
  let color = 0x7cff00;
  let includeReviewLink = false;

  if (isNewPending) {
    webhook = Deno.env.get("DISCORD_PENDING_WEBHOOK");
    title = "🎮 Awaiting Staff Approval";
    description = "A new game request is waiting for staff review.";
    includeReviewLink = true;
  } else if (isAwaitingPayment) {
    webhook = Deno.env.get("DISCORD_AWAITING_PAYMENT_WEBHOOK");
    title = "⏳ Awaiting Payment";
    description = "Staff approved this request. It is waiting for payment confirmation.";
    color = 0xffb000;
  } else if (isNewApproval) {
    webhook = Deno.env.get("DISCORD_APPROVED_WEBHOOK");
    title = "✅ Game Request Approved";
    description = "Payment was confirmed and this request is fully approved.";
    color = 0x35d06f;
  } else if (isNewCompletion) {
    webhook = Deno.env.get("DISCORD_COMPLETED_WEBHOOK");
    title = "🎬 Requested Stream Completed";
    description = "This requested stream is complete and ready to watch from the beginning.";
    color = 0xff2bd6;
  } else if (isNewDenial) {
    webhook = Deno.env.get("DISCORD_DENIED_WEBHOOK");
    title = "❌ Game Request Denied";
    description = shorten(gameRequest.denial_reason);
    color = 0xff3b30;
  } else if (isNewCancellation) {
    webhook = Deno.env.get("DISCORD_CANCELLED_WEBHOOK");
    title = gameRequest.cancellation_reason ? "🚫 Cancelled by Staff" : "🚫 Cancelled by Viewer";
    description = gameRequest.cancellation_reason ? shorten(gameRequest.cancellation_reason) : "The viewer cancelled this request before staff approval.";
    color = 0x8a9490;
  } else if (isNewExpiration) {
    webhook = Deno.env.get("DISCORD_EXPIRED_WEBHOOK");
    title = "⌛ Game Request Expired";
    description = "The 48-hour deadline passed without completion. The request slot is open again.";
    color = 0x707070;
  } else if (isViewerChangeRequested) {
    webhook = Deno.env.get("DISCORD_PENDING_WEBHOOK");
    title = "🔁 Viewer Requested a Game Change";
    description = "A viewer requested a replacement game or console. The current request remains unchanged until staff reviews it.";
    color = 0xff2bd6;
    includeReviewLink = true;
  } else if (isViewerChangeDenied) {
    webhook = Deno.env.get("DISCORD_PENDING_WEBHOOK");
    title = "🚫 Viewer Game Change Denied";
    description = shorten(gameRequest.viewer_change_decision_reason);
    color = 0xff3b30;
    includeReviewLink = true;
  } else if (isRequestUpdated) {
    webhook = gameRequest.status === "pending"
      ? Deno.env.get("DISCORD_PENDING_WEBHOOK")
      : gameRequest.status === "awaiting_payment"
        ? Deno.env.get("DISCORD_AWAITING_PAYMENT_WEBHOOK")
        : Deno.env.get("DISCORD_APPROVED_WEBHOOK");
    title = "✏️ Game Request Updated";
    description = "Staff corrected the requested game or platform. The request choice, price, payment reference, and current status remain unchanged.";
    color = 0xff2bd6;
    includeReviewLink = true;
  } else if (isNewSchedule) {
    webhook = Deno.env.get("DISCORD_SCHEDULE_WEBHOOK") ?? Deno.env.get("DISCORD_APPROVED_WEBHOOK");
    title = previous?.scheduled_for ? "📅 Game Request Rescheduled" : "📅 Game Request Scheduled";
    description = previous?.scheduled_for && gameRequest.schedule_change_reason
      ? `The agreed game time is now ${formatEastern(gameRequest.scheduled_for as string)}. Reason: ${shorten(gameRequest.schedule_change_reason)}`
      : `The agreed game time is ${formatEastern(gameRequest.scheduled_for as string)}.`;
    color = 0x35d06f;
    includeReviewLink = true;
  } else if (isScheduleCleared) {
    webhook = Deno.env.get("DISCORD_SCHEDULE_WEBHOOK") ?? Deno.env.get("DISCORD_APPROVED_WEBHOOK");
    title = "📅 Game Schedule Cleared";
    description = gameRequest.schedule_change_reason
      ? `Staff removed the recorded game time. Reason: ${shorten(gameRequest.schedule_change_reason)}`
      : "Staff removed the recorded game time. The request remains paid and approved.";
    color = 0xffb000;
    includeReviewLink = true;
  } else return Response.json({ ignored: true });

  const eventType = isNewPending ? "new_request"
    : isAwaitingPayment ? "awaiting_payment"
    : isNewApproval ? "request_approved"
    : isNewCompletion ? "request_completed"
    : isNewDenial ? "request_denied"
    : isNewCancellation ? "request_cancelled"
    : isNewExpiration ? "request_expired"
    : isViewerChangeRequested ? "viewer_change_requested"
    : isViewerChangeDenied ? "viewer_change_denied"
    : isRequestUpdated ? "request_updated"
    : isNewSchedule ? "request_scheduled"
    : "schedule_cleared";
  const webhookKey = isNewPending || isViewerChangeRequested || isViewerChangeDenied ? "pending"
    : isAwaitingPayment ? "awaiting_payment"
    : isNewApproval ? "approved"
    : isNewCompletion ? "completed"
    : isNewDenial ? "denied"
    : isNewCancellation ? "cancelled"
    : isNewExpiration ? "expired"
    : isNewSchedule || isScheduleCleared ? "schedule"
    : gameRequest.status === "pending" ? "pending"
    : gameRequest.status === "awaiting_payment" ? "awaiting_payment"
    : "approved";
  const target = webhookKey === "schedule" ? "schedule-updates" : webhookKey === "completed" ? "completed-requests" : webhookKey.replaceAll("_", "-");
  const isViewerChangeNotice = isViewerChangeRequested || isViewerChangeDenied;
  const completedWatchLinks = [
    gameRequest.youtube_vod_url ? `[Watch on YouTube](${gameRequest.youtube_vod_url})` : "",
    gameRequest.twitch_vod_url ? `[Watch on Twitch](${gameRequest.twitch_vod_url})` : "",
  ].filter(Boolean).join(" · ");
  const isOwnerTest = Boolean(gameRequest.is_test);
  if (isOwnerTest) {
    title = "🧪 Owner Test · " + title;
    description = "Owner-only $0 workflow test. " + description;
  }

  const fields = isNewCompletion ? [
    { name: "Requested Stream", value: shorten(gameRequest.game_title), inline: false },
    { name: "System", value: shorten(gameRequest.platform), inline: true },
    { name: "Stream Type", value: requestGoalLabel(gameRequest.request_goal), inline: true },
    { name: "Completed", value: formatEastern(gameRequest.completed_at as string), inline: false },
    { name: "Watch from the Beginning", value: completedWatchLinks || "VOD links unavailable", inline: false },
  ] : [
    { name: isViewerChangeNotice ? "Current Game" : "Game", value: shorten(gameRequest.game_title), inline: false },
    { name: "Twitch Viewer", value: shorten(gameRequest.twitch_name), inline: true },
    { name: "Request Type", value: gameRequest.request_type === "catalog" ? "Owned Catalog Game" : "Not in Catalog", inline: true },
    { name: "Request Choice", value: requestGoalLabel(gameRequest.request_goal)+" · "+(isOwnerTest ? "$0 Owner Test" : "$"+gameRequest.minimum_amount), inline: true },
    { name: isViewerChangeNotice ? "Current Platform" : "Platform", value: shorten(gameRequest.platform), inline: true },
    { name: "Viewer Message", value: shorten(gameRequest.viewer_note), inline: false },
    { name: "Request ID", value: shorten(gameRequest.id), inline: false },
  ];
  if (includeReviewLink) fields.push({ name: "Staff Review", value: `[Open Staff Control](${staffPage})`, inline: false });
  if (!isNewCompletion && gameRequest.scheduled_for) fields.push({ name: "Game Time (Eastern)", value: formatEastern(gameRequest.scheduled_for), inline: false });
  if (!isNewCompletion && gameRequest.schedule_change_reason) fields.push({ name: "Schedule Change Reason", value: shorten(gameRequest.schedule_change_reason), inline: false });
  if (isRequestUpdated) {
    fields.push(
      { name: "Previous Game", value: shorten(previous?.game_title ?? gameRequest.previous_game_title), inline: true },
      { name: "Previous Platform", value: shorten(previous?.platform ?? gameRequest.previous_platform), inline: true },
      { name: "Change Reason", value: shorten(gameRequest.request_change_reason), inline: false },
    );
  }
  if (isViewerChangeRequested || isViewerChangeDenied) {
    fields.push(
      { name: "Requested Game", value: shorten(gameRequest.viewer_change_game_title), inline: true },
      { name: "Requested Platform", value: shorten(gameRequest.viewer_change_platform), inline: true },
      { name: "Viewer's Reason", value: shorten(gameRequest.viewer_change_reason), inline: false },
    );
  }

  const discordBody = {
    username: "⁅𝐓𝐡𝐲𝐓☣︎𝐱𝐢𝐜𝐆𝐚𝐦𝐞𝐫⁆ Game Requests",
    allowed_mentions: { parse: [] },
    embeds: [{ title, description, color, fields, timestamp: isNewCompletion ? gameRequest.completed_at ?? new Date().toISOString() : isViewerChangeRequested ? gameRequest.viewer_change_requested_at ?? new Date().toISOString() : isViewerChangeDenied ? gameRequest.viewer_change_reviewed_at ?? new Date().toISOString() : isRequestUpdated ? gameRequest.request_changed_at ?? new Date().toISOString() : gameRequest.created_at, footer: { text: "⁅𝐓𝐡𝐲𝐓☣︎𝐱𝐢𝐜𝐆𝐚𝐦𝐞𝐫⁆ Request System" } }],
  };

  const sendSystemAudit = async (delivered: boolean, detail: string | null) => {
    const systemWebhook = Deno.env.get("DISCORD_SYSTEM_LOG_WEBHOOK_URL");
    if (!systemWebhook) return;
    const auditBody = {
      username: "ThyToxicBot System Health",
      allowed_mentions: { parse: [] },
      embeds: [{
        title: delivered ? "✅ Request Notification Delivered" : "⚠️ Request Notification Failed",
        description: delivered
          ? `${title} was delivered to its assigned Discord channel.`
          : `${title} could not be delivered. Staff Control can retry the unresolved failure.`,
        color: delivered ? 0x7cff00 : 0xff3b30,
        fields: [
          { name: "Event", value: eventType.replaceAll("_", " "), inline: true },
          { name: "Target", value: target, inline: true },
          { name: "Request ID", value: shorten(gameRequest.id), inline: false },
          ...(detail ? [{ name: "Error", value: shorten(detail, 500), inline: false }] : []),
        ],
        timestamp: new Date().toISOString(),
        footer: { text: "⁅𝐓𝐡𝐲𝐓☣︎𝐱𝐢𝐜𝐆𝐚𝐦𝐞𝐫⁆ Request System" },
      }],
    };
    try {
      const response = await fetch(systemWebhook, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(auditBody),
      });
      if (!response.ok) {
        await recordDelivery({
          event_type: "system_log_alert",
          request_id: gameRequest.id,
          target: "request-system-logs",
          webhook_key: "system",
          status: "failed",
          http_status: response.status,
          error_message: (await response.text().catch(() => `Discord returned ${response.status}`)).slice(0, 500),
          payload: auditBody,
        });
      }
    } catch (error) {
      await recordDelivery({
        event_type: "system_log_alert",
        request_id: gameRequest.id,
        target: "request-system-logs",
        webhook_key: "system",
        status: "failed",
        error_message: error instanceof Error ? error.message.slice(0, 500) : "System-log delivery failed",
        payload: auditBody,
      });
    }
  };

  if (!webhook) {
    const detail = "Required Discord webhook secret is missing";
    await recordDelivery({ event_type: eventType, request_id: gameRequest.id, target, webhook_key: webhookKey, status: "failed", error_message: detail, payload: discordBody });
    await sendSystemAudit(false, detail);
    return Response.json({ error: detail }, { status: 500 });
  }

  let discordResponse: Response;
  try {
    discordResponse = await fetch(webhook, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(discordBody),
    });
  } catch (error) {
    const detail = error instanceof Error ? error.message.slice(0, 500) : "Discord request failed";
    await recordDelivery({ event_type: eventType, request_id: gameRequest.id, target, webhook_key: webhookKey, status: "failed", error_message: detail, payload: discordBody });
    await sendSystemAudit(false, detail);
    return Response.json({ error: "Discord delivery failed", details: detail }, { status: 502 });
  }
  if (!discordResponse.ok) {
    const detail = (await discordResponse.text().catch(() => `Discord returned ${discordResponse.status}`)).slice(0, 500);
    await recordDelivery({ event_type: eventType, request_id: gameRequest.id, target, webhook_key: webhookKey, status: "failed", http_status: discordResponse.status, error_message: detail, payload: discordBody });
    await sendSystemAudit(false, detail);
    return Response.json({ error: `Discord returned ${discordResponse.status}`, details: detail }, { status: 502 });
  }
  const deliveredAt = new Date().toISOString();
  await recordDelivery({ event_type: eventType, request_id: gameRequest.id, target, webhook_key: webhookKey, status: "success", http_status: discordResponse.status, delivered_at: deliveredAt });
  await sendSystemAudit(true, null);
  return Response.json({ delivered: true, requestStatus: gameRequest.status });
});
