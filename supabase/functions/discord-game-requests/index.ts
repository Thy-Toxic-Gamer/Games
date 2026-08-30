type GameRequest = {
  id: string;
  status: string;
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
  const expectedToken = Deno.env.get("DATABASE_WEBHOOK_TOKEN");
  const suppliedToken = request.headers.get("x-webhook-token");
  if (!expectedToken || suppliedToken !== expectedToken) return Response.json({ error: "Unauthorized webhook request" }, { status: 401 });

  let payload: WebhookPayload;
  try { payload = await request.json(); }
  catch { return Response.json({ error: "Invalid JSON payload" }, { status: 400 }); }

  const gameRequest = payload.record;
  const previous = payload.old_record;
  if (payload.schema !== "public" || payload.table !== "game_requests" || !gameRequest) return Response.json({ ignored: true });

  const isNewPending = payload.type === "INSERT" && gameRequest.status === "pending";
  const isAwaitingPayment = payload.type === "UPDATE" && gameRequest.status === "awaiting_payment" && previous?.status !== "awaiting_payment";
  const isNewApproval = payload.type === "UPDATE" && gameRequest.status === "approved" && previous?.status !== "approved";
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

  if (!webhook) return Response.json({ error: "Required Discord webhook secret is missing" }, { status: 500 });
  const isViewerChangeNotice = isViewerChangeRequested || isViewerChangeDenied;
  const fields = [
    { name: isViewerChangeNotice ? "Current Game" : "Game", value: shorten(gameRequest.game_title), inline: false },
    { name: "Twitch Viewer", value: shorten(gameRequest.twitch_name), inline: true },
    { name: "Request Type", value: gameRequest.request_type === "catalog" ? "Owned Catalog Game" : "Not in Catalog", inline: true },
    { name: "Request Choice", value: `${requestGoalLabel(gameRequest.request_goal)} · $${gameRequest.minimum_amount}`, inline: true },
    { name: isViewerChangeNotice ? "Current Platform" : "Platform", value: shorten(gameRequest.platform), inline: true },
    { name: "Viewer Message", value: shorten(gameRequest.viewer_note), inline: false },
    { name: "Request ID", value: shorten(gameRequest.id), inline: false },
  ];
  if (includeReviewLink) fields.push({ name: "Staff Review", value: `[Open Staff Control](${staffPage})`, inline: false });
  if (gameRequest.scheduled_for) fields.push({ name: "Game Time (Eastern)", value: formatEastern(gameRequest.scheduled_for), inline: false });
  if (gameRequest.schedule_change_reason) fields.push({ name: "Schedule Change Reason", value: shorten(gameRequest.schedule_change_reason), inline: false });
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

  const discordResponse = await fetch(webhook, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username: "ThyToxicGamer Game Requests", allowed_mentions: { parse: [] }, embeds: [{ title, description, color, fields, timestamp: isViewerChangeRequested ? gameRequest.viewer_change_requested_at ?? new Date().toISOString() : isViewerChangeDenied ? gameRequest.viewer_change_reviewed_at ?? new Date().toISOString() : isRequestUpdated ? gameRequest.request_changed_at ?? new Date().toISOString() : gameRequest.created_at, footer: { text: "ThyToxicGamer Request System" } }] }),
  });
  if (!discordResponse.ok) return Response.json({ error: `Discord returned ${discordResponse.status}`, details: (await discordResponse.text()).slice(0, 500) }, { status: 502 });
  return Response.json({ delivered: true, requestStatus: gameRequest.status });
});
