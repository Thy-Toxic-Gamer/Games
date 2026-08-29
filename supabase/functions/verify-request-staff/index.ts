import { createClient } from "npm:@supabase/supabase-js@2";

const allowedOrigin =
  Deno.env.get("SITE_ORIGIN") ?? "https://thy-toxic-gamer.github.io";

const corsHeaders = {
  "Access-Control-Allow-Origin": allowedOrigin,
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Vary": "Origin",
};

type TwitchValidation = {
  client_id?: string;
  login?: string;
  scopes?: string[];
  user_id?: string;
  expires_in?: number;
};

type TwitchModeratedChannels = {
  data?: Array<{
    broadcaster_id: string;
    broadcaster_login: string;
    broadcaster_name: string;
  }>;
  pagination?: { cursor?: string };
};

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

function linkedTwitchIds(user: {
  identities?: Array<{
    id?: string;
    provider?: string;
    identity_data?: Record<string, unknown>;
  }>;
  user_metadata?: Record<string, unknown>;
}) {
  const values = new Set<string>();
  const add = (value: unknown) => {
    if (typeof value === "string" && value.trim()) values.add(value.trim());
  };

  for (const identity of user.identities ?? []) {
    if (identity.provider !== "twitch") continue;
    add(identity.id);
    add(identity.identity_data?.sub);
    add(identity.identity_data?.provider_id);
    add(identity.identity_data?.user_id);
  }

  add(user.user_metadata?.sub);
  add(user.user_metadata?.provider_id);
  add(user.user_metadata?.user_id);
  return values;
}

async function isModeratorForBroadcaster(
  token: string,
  validation: TwitchValidation,
  broadcasterId: string,
) {
  let cursor = "";

  for (let page = 0; page < 25; page += 1) {
    const url = new URL("https://api.twitch.tv/helix/moderation/channels");
    url.searchParams.set("user_id", validation.user_id ?? "");
    url.searchParams.set("first", "100");
    if (cursor) url.searchParams.set("after", cursor);

    const response = await fetch(url, {
      headers: {
        Authorization: `Bearer ${token}`,
        "Client-Id": validation.client_id ?? "",
      },
    });

    if (!response.ok) {
      throw new Error(`Twitch moderation lookup returned ${response.status}`);
    }

    const result = (await response.json()) as TwitchModeratedChannels;
    if (
      result.data?.some((channel) => channel.broadcaster_id === broadcasterId)
    ) {
      return true;
    }

    cursor = result.pagination?.cursor ?? "";
    if (!cursor) return false;
  }

  throw new Error("Twitch moderation lookup exceeded the pagination limit");
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
  const broadcasterId = Deno.env.get("TWITCH_BROADCASTER_ID");
  const authorization = request.headers.get("Authorization");

  if (!supabaseUrl || !anonKey || !serviceRoleKey || !broadcasterId) {
    return json({ error: "Moderator verification is not configured" }, 503);
  }
  if (!authorization) {
    return json({ error: "Authentication required" }, 401);
  }

  const caller = createClient(supabaseUrl, anonKey, {
    global: { headers: { Authorization: authorization } },
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const { data: userData, error: userError } = await caller.auth.getUser();
  if (userError || !userData.user) {
    return json({ error: "Invalid Supabase session" }, 401);
  }

  const payload = await request.json().catch(() => ({}));
  const providerToken =
    typeof payload.providerToken === "string"
      ? payload.providerToken.trim()
      : "";
  if (!providerToken) {
    return json({ error: "A fresh Twitch sign-in is required" }, 400);
  }

  const validationResponse = await fetch(
    "https://id.twitch.tv/oauth2/validate",
    { headers: { Authorization: `OAuth ${providerToken}` } },
  );
  if (!validationResponse.ok) {
    return json({ error: "The Twitch session is no longer valid" }, 401);
  }

  const validation = (await validationResponse.json()) as TwitchValidation;
  if (
    !validation.user_id ||
    !validation.login ||
    !validation.client_id ||
    !validation.scopes?.includes("user:read:moderated_channels")
  ) {
    return json({
      error:
        "Twitch moderator permission is missing. Sign out, then sign in again.",
    }, 403);
  }

  const linkedIds = linkedTwitchIds(userData.user);
  if (!linkedIds.has(validation.user_id)) {
    return json({ error: "Twitch identity does not match this account" }, 403);
  }

  const admin = createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const { data: existing, error: existingError } = await admin
    .from("request_staff")
    .select("user_id,role,can_review,access_source,verified_at")
    .eq("user_id", userData.user.id)
    .maybeSingle();
  if (existingError) {
    console.error("Staff lookup failed", existingError);
    return json({ error: "Staff verification could not be saved" }, 500);
  }

  const isBroadcaster = validation.user_id === broadcasterId;
  let isModerator = false;
  try {
    isModerator = isBroadcaster ||
      await isModeratorForBroadcaster(
        providerToken,
        validation,
        broadcasterId,
      );
  } catch (error) {
    console.error("Twitch moderator lookup failed", error);
    return json({ error: "Twitch moderator status could not be checked" }, 502);
  }

  if (
    existing &&
    (existing.role === "owner" || existing.access_source === "manual")
  ) {
    return json({
      isStaff: true,
      role: existing.role,
      canReview: existing.can_review,
      accessSource: existing.access_source,
      verifiedAt: existing.verified_at,
    });
  }

  if (isModerator) {
    const verifiedAt = new Date().toISOString();
    const { error: upsertError } = await admin.from("request_staff").upsert({
      user_id: userData.user.id,
      role: isBroadcaster ? "owner" : "moderator",
      can_review: true,
      access_source: isBroadcaster ? "twitch_owner" : "twitch_moderator",
      twitch_user_id: validation.user_id,
      twitch_login: validation.login,
      verified_at: verifiedAt,
    }, { onConflict: "user_id" });

    if (upsertError) {
      console.error("Staff grant failed", upsertError);
      return json({ error: "Staff verification could not be saved" }, 500);
    }

    return json({
      isStaff: true,
      role: isBroadcaster ? "owner" : "moderator",
      canReview: true,
      accessSource: isBroadcaster ? "twitch_owner" : "twitch_moderator",
      verifiedAt,
    });
  }

  if (existing?.access_source === "twitch_moderator") {
    const { error: revokeError } = await admin
      .from("request_staff")
      .delete()
      .eq("user_id", userData.user.id)
      .eq("access_source", "twitch_moderator");
    if (revokeError) {
      console.error("Automatic staff revocation failed", revokeError);
      return json({ error: "Staff verification could not be updated" }, 500);
    }
  }

  return json({
    isStaff: false,
    role: null,
    canReview: false,
    accessSource: null,
  });
});
