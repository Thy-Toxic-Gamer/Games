type GameRequest = {
  id: string;
  status: string;
  game_title: string;
  twitch_name: string;
  request_type: string;
  minimum_amount: number;
  platform: string | null;
  viewer_note: string | null;
  denial_reason: string | null;
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
  } else return Response.json({ ignored: true });

  if (!webhook) return Response.json({ error: "Required Discord webhook secret is missing" }, { status: 500 });
  const fields = [
    { name: "Game", value: shorten(gameRequest.game_title), inline: false },
    { name: "Twitch Viewer", value: shorten(gameRequest.twitch_name), inline: true },
    { name: "Request Tier", value: gameRequest.request_type === "catalog" ? `Owned Catalog Game · $${gameRequest.minimum_amount}+` : `Not in Catalog · $${gameRequest.minimum_amount}+`, inline: true },
    { name: "Platform", value: shorten(gameRequest.platform), inline: true },
    { name: "Viewer Message", value: shorten(gameRequest.viewer_note), inline: false },
    { name: "Request ID", value: shorten(gameRequest.id), inline: false },
  ];
  if (includeReviewLink) fields.push({ name: "Staff Review", value: `[Open Staff Control](${staffPage})`, inline: false });

  const discordResponse = await fetch(webhook, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username: "ThyToxicGamer Game Requests", allowed_mentions: { parse: [] }, embeds: [{ title, description, color, fields, timestamp: gameRequest.created_at, footer: { text: "ThyToxicGamer Request System" } }] }),
  });
  if (!discordResponse.ok) return Response.json({ error: `Discord returned ${discordResponse.status}`, details: (await discordResponse.text()).slice(0, 500) }, { status: 502 });
  return Response.json({ delivered: true, requestStatus: gameRequest.status });
});
