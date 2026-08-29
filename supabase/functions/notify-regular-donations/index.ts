import { createClient } from "npm:@supabase/supabase-js@2";

type StreamElementsTip = {
  _id?: string;
  id?: string;
  provider?: string;
  status?: string;
  approved?: string;
  deleted?: boolean;
  createdAt?: string;
  username?: string;
  name?: string;
  user?: {
    username?: string;
    displayName?: string;
    name?: string;
  };
  donation?: {
    message?: string;
    amount?: number;
    currency?: string;
    user?: {
      username?: string;
      displayName?: string;
      name?: string;
    };
  };
};

const gameRequestCode = /\bTG-[A-Z0-9]{8,16}\b/i;

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

function cleanText(value: unknown, fallback: string, maximum: number) {
  const text = String(value || "").trim();
  return (text || fallback).slice(0, maximum);
}

function donorName(tip: StreamElementsTip) {
  return cleanText(
    tip.donation?.user?.displayName ||
      tip.donation?.user?.username ||
      tip.donation?.user?.name ||
      tip.user?.displayName ||
      tip.user?.username ||
      tip.user?.name ||
      tip.username ||
      tip.name,
    "Anonymous",
    256,
  );
}

function formattedAmount(amount: number, currency: string) {
  try {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency,
    }).format(amount);
  } catch {
    return `${amount.toFixed(2)} ${currency}`;
  }
}

Deno.serve(async (request) => {
  if (request.method !== "POST") {
    return json({ error: "Method not allowed" }, 405);
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  const accountId = Deno.env.get("STREAMELEMENTS_ACCOUNT_ID");
  const streamElementsJwt = Deno.env.get("STREAMELEMENTS_JWT");
  const discordWebhook = Deno.env.get("DISCORD_DONATIONS_WEBHOOK");

  if (
    !supabaseUrl ||
    !serviceRoleKey ||
    !accountId ||
    !streamElementsJwt ||
    !discordWebhook
  ) {
    return json({ error: "Regular donation notifier is not configured" }, 503);
  }

  const suppliedApiKey = request.headers.get("apikey");
  const authorization = request.headers.get("Authorization") || "";
  const suppliedBearer = authorization.startsWith("Bearer ")
    ? authorization.slice(7)
    : "";

  if (
    suppliedApiKey !== serviceRoleKey &&
    suppliedBearer !== serviceRoleKey
  ) {
    return json({ error: "Unauthorized scheduled request" }, 401);
  }

  const admin = createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const { data: state, error: stateError } = await admin
    .from("regular_donation_notifier_state")
    .select("started_at")
    .eq("id", true)
    .maybeSingle();

  if (stateError || !state?.started_at) {
    console.error("Donation notifier state lookup failed", stateError);
    return json({ error: "Donation notifier database is not configured" }, 500);
  }

  const channelResponse = await fetch(
    "https://api.streamelements.com/kappa/v2/channels/me",
    {
      headers: {
        Authorization: `Bearer ${streamElementsJwt}`,
        Accept: "application/json",
      },
    },
  );

  if (!channelResponse.ok) {
    return json({ error: "StreamElements channel lookup failed" }, 502);
  }

  const channelPayload = await channelResponse.json();
  const channel = channelPayload?.channel || channelPayload;
  const channelId = String(channel?._id || channel?.id || "");

  if (!channelId || channelId !== String(accountId)) {
    return json({ error: "StreamElements payment channel does not match" }, 503);
  }

  const tipsResponse = await fetch(
    `https://api.streamelements.com/kappa/v2/tips/${
      encodeURIComponent(channelId)
    }/moderation`,
    {
      headers: {
        Authorization: `Bearer ${streamElementsJwt}`,
        Accept: "application/json",
      },
    },
  );

  if (!tipsResponse.ok) {
    return json({ error: "StreamElements tip lookup failed" }, 502);
  }

  const tipsPayload = await tipsResponse.json();
  const tips: StreamElementsTip[] = Array.isArray(tipsPayload?.recent)
    ? tipsPayload.recent
    : [];
  const startedAt = new Date(state.started_at).getTime();

  const eligibleTips = tips
    .filter((tip) => {
      const createdAt = tip.createdAt
        ? new Date(tip.createdAt).getTime()
        : 0;
      const amount = Number(tip.donation?.amount);
      const message = String(tip.donation?.message || "");
      const successful = String(tip.status || "").toLowerCase() === "success";
      const notRejected =
        String(tip.approved || "").toLowerCase() !== "rejected";

      return (
        Boolean(tip._id || tip.id) &&
        successful &&
        notRejected &&
        tip.deleted !== true &&
        Number.isFinite(amount) &&
        amount > 0 &&
        createdAt >= startedAt &&
        !gameRequestCode.test(message)
      );
    })
    .sort((left, right) =>
      new Date(left.createdAt || 0).getTime() -
      new Date(right.createdAt || 0).getTime()
    );

  let announced = 0;
  let alreadyProcessed = 0;
  let failed = 0;

  for (const tip of eligibleTips) {
    const tipId = String(tip._id || tip.id || "");
    const amount = Number(tip.donation?.amount);
    const currency = cleanText(tip.donation?.currency, "USD", 10).toUpperCase();
    const name = donorName(tip);
    const message = cleanText(
      tip.donation?.message,
      "No message provided.",
      1000,
    );
    const tipCreatedAt = new Date(tip.createdAt || Date.now()).toISOString();

    const { error: claimError } = await admin
      .from("regular_donation_notifications")
      .insert({
        tip_id: tipId,
        donor_name: name,
        amount,
        currency,
        donation_message: message,
        tip_created_at: tipCreatedAt,
      });

    if (claimError?.code === "23505") {
      alreadyProcessed += 1;
      continue;
    }

    if (claimError) {
      console.error("Donation claim failed", {
        tipId,
        code: claimError.code,
        message: claimError.message,
      });
      failed += 1;
      continue;
    }

    const discordResponse = await fetch(discordWebhook, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        username: "ThyToxicGamer Donations",
        allowed_mentions: { parse: [] },
        embeds: [
          {
            title: "☣️ New StreamElements Donation",
            description: message,
            color: 6750208,
            fields: [
              { name: "Donor", value: name, inline: true },
              {
                name: "Amount",
                value: formattedAmount(amount, currency),
                inline: true,
              },
              { name: "Platform", value: "StreamElements", inline: true },
            ],
            footer: { text: "Regular donation · Not a game request" },
            timestamp: tipCreatedAt,
          },
        ],
      }),
    });

    if (!discordResponse.ok) {
      const detail = await discordResponse.text().catch(() => "");
      console.error("Discord donation notification failed", {
        tipId,
        status: discordResponse.status,
        detail: detail.slice(0, 300),
      });

      await admin
        .from("regular_donation_notifications")
        .delete()
        .eq("tip_id", tipId);

      failed += 1;
      continue;
    }

    await admin
      .from("regular_donation_notifications")
      .update({ discord_sent_at: new Date().toISOString() })
      .eq("tip_id", tipId);

    announced += 1;
  }

  return json({
    checked: tips.length,
    eligible: eligibleTips.length,
    announced,
    alreadyProcessed,
    failed,
  });
});
