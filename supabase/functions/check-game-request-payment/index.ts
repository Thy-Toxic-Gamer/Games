import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

type StreamElementsActivity = {
  _id?: string;
  type?: string;
  provider?: string;
  createdAt?: string;
  isMock?: boolean;
  mock?: boolean;
  data?: {
    message?: string;
    amount?: number;
    currency?: string;
    tipId?: string;
    isMock?: boolean;
    mock?: boolean;
  };
};

type StreamElementsTip = {
  _id?: string;
  id?: string;
  provider?: string;
  status?: string;
  approved?: string;
  deleted?: boolean;
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
    headers: {
      ...corsHeaders,
      "Content-Type": "application/json",
    },
  });
}

Deno.serve(async (request) => {
  if (request.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (request.method !== "POST") {
    return json({ error: "Method not allowed" }, 405);
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const anonKey = Deno.env.get("SUPABASE_ANON_KEY");
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  const accountId = Deno.env.get("STREAMELEMENTS_ACCOUNT_ID");
  const streamElementsJwt = Deno.env.get("STREAMELEMENTS_JWT");
  const authorization = request.headers.get("Authorization");

  if (
    !supabaseUrl ||
    !anonKey ||
    !serviceRoleKey ||
    !accountId ||
    !streamElementsJwt
  ) {
    return json({ error: "Payment service is not configured" }, 503);
  }

  if (!authorization) {
    return json({ error: "Authentication required" }, 401);
  }

  const viewerClient = createClient(supabaseUrl, anonKey, {
    global: {
      headers: {
        Authorization: authorization,
      },
    },
  });

  const { data: userData, error: userError } =
    await viewerClient.auth.getUser();

  if (userError || !userData.user) {
    return json({ error: "Invalid session" }, 401);
  }

  const payload = await request.json().catch(() => ({}));

  const requestId =
    typeof payload.requestId === "string"
      ? payload.requestId
      : "";

  if (!requestId) {
    return json({ error: "Request ID is required" }, 400);
  }

  const admin = createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });

  const { data: gameRequest, error: requestError } =
    await admin
      .from("game_requests")
      .select(
        "id,viewer_id,status,minimum_amount,payment_reference,payment_deadline,created_at",
      )
      .eq("id", requestId)
      .eq("viewer_id", userData.user.id)
      .maybeSingle();

  if (requestError) {
    console.error("Request lookup failed", {
      code: requestError.code,
      message: requestError.message,
      details: requestError.details,
    });

    return json(
      {
        error: "Request lookup failed",
        code: requestError.code,
        detail: requestError.message,
      },
      500,
    );
  }

  if (!gameRequest) {
    return json({ error: "Request not found" }, 404);
  }

  if (gameRequest.status !== "awaiting_payment") {
    return json({ status: gameRequest.status });
  }

  if (
    gameRequest.payment_deadline &&
    new Date(gameRequest.payment_deadline).getTime() <= Date.now()
  ) {
    await admin
      .from("game_requests")
      .update({ status: "expired" })
      .eq("id", gameRequest.id)
      .eq("status", "awaiting_payment");

    return json({ status: "expired" });
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
    return json(
      { error: "StreamElements channel lookup failed" },
      502,
    );
  }

  const channelPayload = await channelResponse.json();
  const channel = channelPayload?.channel || channelPayload;

  const channelId = String(
    channel?._id ||
    channel?.id ||
    "",
  );

  if (!channelId) {
    return json(
      { error: "StreamElements returned an invalid channel" },
      502,
    );
  }

  console.log("StreamElements channel diagnostics", {
    username:
      channel?.username ||
      channel?.displayName ||
      null,
    configuredAccountMatchesJwt:
      String(accountId) === channelId,
  });

const moderationResponse = await fetch(
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

const moderationPayload = moderationResponse.ok
  ? await moderationResponse.json()
  : {};

const recentModerationTips: StreamElementsTip[] =
  Array.isArray(moderationPayload?.recent)
    ? moderationPayload.recent
    : [];

const pendingModerationTips: StreamElementsTip[] =
  Array.isArray(moderationPayload?.pending)
    ? moderationPayload.pending
    : [];

console.log("Tip moderation diagnostics", {
  httpStatus: moderationResponse.status,
  recentCount: recentModerationTips.length,
  pendingCount: pendingModerationTips.length,
  tips: [...recentModerationTips, ...pendingModerationTips]
    .slice(0, 10)
    .map((tip) => ({
      amount: Number(tip.donation?.amount),
      status: tip.status || null,
      approved: tip.approved || null,
      createdAt: tip.createdAt || null,
      messageMatches:
        String(tip.donation?.message || "")
          .toUpperCase()
          .includes(
            String(gameRequest.payment_reference || "")
              .toUpperCase(),
          ),
    })),
});

  const activityParameters = new URLSearchParams({
  limit: "100",
  types: "tip",
  count: "true",
  origin: "feed",
});

const activityResponse = await fetch(
  `https://api.streamelements.com/kappa/v3/activities/${
    encodeURIComponent(channelId)
  }?${activityParameters.toString()}`,
    {
      headers: {
        Authorization: `Bearer ${streamElementsJwt}`,
        Accept: "application/json",
      },
    },
  );

  if (!activityResponse.ok) {
    const activityError = await activityResponse
      .text()
      .catch(() => "");

    console.error("StreamElements activity lookup failed", {
      status: activityResponse.status,
      detail: activityError,
    });

    return json(
      { error: "StreamElements activity lookup failed" },
      502,
    );
  }

  const activityPayload = await activityResponse.json();

  const activities: StreamElementsActivity[] =
    Array.isArray(activityPayload)
      ? activityPayload
      : Array.isArray(activityPayload?.docs)
        ? activityPayload.docs
        : [];

  const reference =
    String(gameRequest.payment_reference || "").toUpperCase();

  const minimum = Number(gameRequest.minimum_amount);

  const requestCreated =
    new Date(gameRequest.created_at).getTime();

  console.log("Activity match diagnostics", {
    activitiesCount: activities.length,
    reference,
    minimum,
    requestCreated: gameRequest.created_at,
    recentActivities: activities.slice(0, 10).map((activity) => ({
      type: activity.type || null,
      amount: Number(activity.data?.amount),
      createdAt: activity.createdAt || null,
      hasTipId: Boolean(activity.data?.tipId),
      isMock: Boolean(
        activity.isMock ||
        activity.mock ||
        activity.data?.isMock ||
        activity.data?.mock
      ),
      messageMatches:
        String(activity.data?.message || "")
          .toUpperCase()
          .includes(reference),
    })),
  });

  const moderationMatch = [
    ...recentModerationTips,
    ...pendingModerationTips,
  ].find((tip) => {
    const message =
      String(tip.donation?.message || "").toUpperCase();

    const amount =
      Number(tip.donation?.amount);

    const created = tip.createdAt
      ? new Date(tip.createdAt).getTime()
      : 0;

    const successful =
      String(tip.status || "").toLowerCase() === "success";

    const notRejected =
      String(tip.approved || "").toLowerCase() !== "rejected";

    const notDeleted =
      tip.deleted !== true;

    return (
      reference &&
      message.includes(reference) &&
      amount >= minimum &&
      created >= requestCreated &&
      successful &&
      notRejected &&
      notDeleted
    );
  });

  const activityMatch = activities.find((activity) => {
    const message =
      String(activity.data?.message || "").toUpperCase();

    const amount = Number(activity.data?.amount);

    const created = activity.createdAt
      ? new Date(activity.createdAt).getTime()
      : 0;

    const isTip =
      String(activity.type || "").toLowerCase() === "tip";

    const isMock = Boolean(
      activity.isMock ||
      activity.mock ||
      activity.data?.isMock ||
      activity.data?.mock
    );

    const hasTipId =
      typeof activity.data?.tipId === "string" &&
      activity.data.tipId.length > 0;

    return (
      isTip &&
      !isMock &&
      hasTipId &&
      reference &&
      message.includes(reference) &&
      amount >= minimum &&
      created >= requestCreated
    );
  });

  if (!moderationMatch && !activityMatch) {
    return json({ status: "awaiting_payment" });
  }

  const tipId = String(
    moderationMatch?._id ||
    moderationMatch?.id ||
    activityMatch?.data?.tipId ||
    "",
  );

  if (!tipId) {
    return json(
      { error: "StreamElements record has no tip ID" },
      502,
    );
  }

  let paymentProvider =
    moderationMatch?.provider ||
    activityMatch?.provider ||
    "streamelements";

  let paymentCurrency =
    moderationMatch?.donation?.currency ||
    activityMatch?.data?.currency ||
    "USD";

  let paymentAmount = Number(
    moderationMatch?.donation?.amount ??
    activityMatch?.data?.amount,
  );

  const tipDetailsResponse = await fetch(
    `https://api.streamelements.com/kappa/v2/tips/${
      encodeURIComponent(channelId)
    }/${encodeURIComponent(tipId)}`,
    {
      headers: {
        Authorization: `Bearer ${streamElementsJwt}`,
        Accept: "application/json",
      },
    },
  );

  if (tipDetailsResponse.ok) {
    const tip: StreamElementsTip =
      await tipDetailsResponse.json();

    const tipMessage =
      String(tip.donation?.message || "").toUpperCase();

    const tipAmount =
      Number(tip.donation?.amount);

    const tipCreated = tip.createdAt
      ? new Date(tip.createdAt).getTime()
      : 0;

    const successful =
      String(tip.status || "").toLowerCase() === "success";

    const notRejected =
      String(tip.approved || "").toLowerCase() !== "rejected";

    const notDeleted =
      tip.deleted !== true;

    const verified =
      tipMessage.includes(reference) &&
      tipAmount >= minimum &&
      tipCreated >= requestCreated &&
      successful &&
      notRejected &&
      notDeleted;

    if (!verified) {
      console.error("Tip detail verification failed", {
        tipId,
        amount: tipAmount,
        status: tip.status || null,
        approved: tip.approved || null,
        deleted: tip.deleted || false,
        createdAt: tip.createdAt || null,
        messageMatches: tipMessage.includes(reference),
      });

      return json({ status: "awaiting_payment" });
    }

    paymentProvider =
      tip.provider ||
      tip.donation?.paymentMethod ||
      paymentProvider;

    paymentCurrency =
      tip.donation?.currency ||
      paymentCurrency;

    paymentAmount =
      Number(tip.donation?.amount);
  } else {
    console.warn(
      "Individual tip details were unavailable; using verified StreamElements record",
      {
        tipId,
        status: tipDetailsResponse.status,
      },
    );
  }

  const { data: updated, error: updateError } =
    await admin
      .from("game_requests")
      .update({
        status: "approved",
        streamelements_tip_id: tipId,
        payment_provider: paymentProvider,
        payment_currency: paymentCurrency,
        payment_amount: paymentAmount,
        paid_at: new Date().toISOString(),
      })
      .eq("id", gameRequest.id)
      .eq("status", "awaiting_payment")
      .is("streamelements_tip_id", null)
      .select("status")
      .maybeSingle();

  if (updateError) {
    if (updateError.code === "23505") {
      return json(
        { error: "This tip was already used" },
        409,
      );
    }

    console.error("Payment confirmation update failed", {
      code: updateError.code,
      message: updateError.message,
      details: updateError.details,
    });

    return json(
      { error: "Payment confirmation failed" },
      500,
    );
  }

  return json({
    status: updated?.status || "approved",
  });
});
