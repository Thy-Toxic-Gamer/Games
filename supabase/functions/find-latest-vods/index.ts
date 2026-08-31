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

type VodCandidate = {
  title: string;
  url: string;
  publishedAt: string;
};

type YouTubeSearchResponse = {
  items?: Array<{
    id?: { videoId?: string };
    snippet?: { title?: string; publishedAt?: string };
  }>;
  error?: { message?: string };
};

type TwitchValidation = {
  client_id?: string;
  user_id?: string;
};

type TwitchVideosResponse = {
  data?: Array<{
    title?: string;
    url?: string;
    created_at?: string;
  }>;
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

function titleWords(value: string) {
  return new Set(
    value.toLowerCase().replace(/[^a-z0-9]+/g, " ").split(/\s+/)
      .filter((word) => word.length > 2),
  );
}

function bestCandidate(
  candidates: VodCandidate[],
  gameTitle: string,
  targetValue: string | null,
) {
  if (!candidates.length) return null;
  const wantedWords = titleWords(gameTitle);
  const target = targetValue ? new Date(targetValue).getTime() : Date.now();
  return candidates
    .map((candidate) => {
      const candidateWords = titleWords(candidate.title);
      const overlap = [...wantedWords].filter((word) => candidateWords.has(word)).length;
      const titleScore = wantedWords.size ? overlap / wantedWords.size : 0;
      const published = new Date(candidate.publishedAt).getTime();
      const distanceHours = Number.isFinite(published)
        ? Math.abs(target - published) / 3_600_000
        : 240;
      return {
        ...candidate,
        score: titleScore * 100 - Math.min(distanceHours, 240) / 6,
      };
    })
    .sort((left, right) => right.score - left.score)[0];
}

async function findYouTubeVod(
  gameTitle: string,
  targetValue: string | null,
) {
  const apiKey = Deno.env.get("YOUTUBE_API_KEY");
  const channelId = Deno.env.get("YOUTUBE_CHANNEL_ID");
  if (!apiKey || !channelId) {
    throw new Error("YouTube lookup secrets are not configured");
  }

  const url = new URL("https://www.googleapis.com/youtube/v3/search");
  url.searchParams.set("part", "snippet");
  url.searchParams.set("channelId", channelId);
  url.searchParams.set("eventType", "completed");
  url.searchParams.set("type", "video");
  url.searchParams.set("order", "date");
  url.searchParams.set("maxResults", "10");
  url.searchParams.set("key", apiKey);
  const response = await fetch(url, { signal: AbortSignal.timeout(12_000) });
  const result = (await response.json()) as YouTubeSearchResponse;
  if (!response.ok) {
    throw new Error(result.error?.message ?? `YouTube returned ${response.status}`);
  }

  const candidates = (result.items ?? []).flatMap((item) => {
    const videoId = item.id?.videoId;
    const publishedAt = item.snippet?.publishedAt;
    if (!videoId || !publishedAt) return [];
    return [{
      title: item.snippet?.title ?? "Completed YouTube stream",
      url: `https://www.youtube.com/watch?v=${encodeURIComponent(videoId)}`,
      publishedAt,
    }];
  });
  return bestCandidate(candidates, gameTitle, targetValue);
}

async function findTwitchVod(
  gameTitle: string,
  targetValue: string | null,
  providerToken: string,
  linkedIds: Set<string>,
) {
  const broadcasterId = Deno.env.get("TWITCH_BROADCASTER_ID");
  if (!broadcasterId) throw new Error("Twitch broadcaster ID is not configured");
  if (!providerToken) throw new Error("Sign in with Twitch again to search Twitch VODs");

  const validationResponse = await fetch("https://id.twitch.tv/oauth2/validate", {
    headers: { Authorization: `OAuth ${providerToken}` },
    signal: AbortSignal.timeout(12_000),
  });
  if (!validationResponse.ok) throw new Error("The Twitch session must be refreshed");
  const validation = (await validationResponse.json()) as TwitchValidation;
  if (!validation.client_id || !validation.user_id || !linkedIds.has(validation.user_id)) {
    throw new Error("The Twitch session does not match the signed-in staff account");
  }

  const url = new URL("https://api.twitch.tv/helix/videos");
  url.searchParams.set("user_id", broadcasterId);
  url.searchParams.set("type", "archive");
  url.searchParams.set("sort", "time");
  url.searchParams.set("first", "10");
  const response = await fetch(url, {
    headers: {
      Authorization: `Bearer ${providerToken}`,
      "Client-Id": validation.client_id,
    },
    signal: AbortSignal.timeout(12_000),
  });
  if (!response.ok) throw new Error(`Twitch returned ${response.status}`);
  const result = (await response.json()) as TwitchVideosResponse;
  const candidates = (result.data ?? []).flatMap((item) => {
    if (!item.url || !item.created_at) return [];
    return [{
      title: item.title ?? "Twitch stream archive",
      url: item.url,
      publishedAt: item.created_at,
    }];
  });
  return bestCandidate(candidates, gameTitle, targetValue);
}

Deno.serve(async (request) => {
  if (request.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (request.method !== "POST") return json({ error: "Method not allowed" }, 405);

  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const anonKey = Deno.env.get("SUPABASE_ANON_KEY");
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  const authorization = request.headers.get("Authorization");
  if (!supabaseUrl || !anonKey || !serviceRoleKey) {
    return json({ error: "VOD lookup is not configured" }, 503);
  }
  if (!authorization) return json({ error: "Authentication required" }, 401);

  const caller = createClient(supabaseUrl, anonKey, {
    global: { headers: { Authorization: authorization } },
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const [{ data: userData, error: userError }, { data: access, error: accessError }] =
    await Promise.all([
      caller.auth.getUser(),
      caller.rpc("my_request_staff_access"),
    ]);
  if (userError || !userData.user) return json({ error: "Invalid Supabase session" }, 401);
  if (accessError || !access?.isStaff || !access?.canReview) {
    return json({ error: "Verified staff access required" }, 403);
  }

  const payload = await request.json().catch(() => ({}));
  const requestId = typeof payload.requestId === "string" ? payload.requestId.trim() : "";
  const providerToken = typeof payload.providerToken === "string"
    ? payload.providerToken.trim()
    : "";
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(requestId)) {
    return json({ error: "A valid game request is required" }, 400);
  }

  const admin = createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const { data: gameRequest, error: requestError } = await admin
    .from("game_requests")
    .select("id,status,paid_at,game_title,scheduled_for,completed_at")
    .eq("id", requestId)
    .maybeSingle();
  if (requestError || !gameRequest) return json({ error: "Game request not found" }, 404);
  if (gameRequest.status !== "approved" || !gameRequest.paid_at) {
    return json({ error: "Only paid and approved requests can search for VODs" }, 409);
  }

  const targetValue = gameRequest.scheduled_for ?? gameRequest.completed_at ?? null;
  const [youtubeResult, twitchResult] = await Promise.allSettled([
    findYouTubeVod(gameRequest.game_title, targetValue),
    findTwitchVod(
      gameRequest.game_title,
      targetValue,
      providerToken,
      linkedTwitchIds(userData.user),
    ),
  ]);
  const youtube = youtubeResult.status === "fulfilled" ? youtubeResult.value : null;
  const twitch = twitchResult.status === "fulfilled" ? twitchResult.value : null;
  const warnings = [
    youtubeResult.status === "rejected"
      ? `YouTube: ${youtubeResult.reason instanceof Error ? youtubeResult.reason.message : "lookup failed"}`
      : youtube ? "" : "YouTube: no completed broadcast was found",
    twitchResult.status === "rejected"
      ? `Twitch: ${twitchResult.reason instanceof Error ? twitchResult.reason.message : "lookup failed"}`
      : twitch ? "" : "Twitch: no recent archive was found",
  ].filter(Boolean);

  return json({
    youtube: youtube && {
      title: youtube.title,
      url: youtube.url,
      publishedAt: youtube.publishedAt,
    },
    twitch: twitch && {
      title: twitch.title,
      url: twitch.url,
      publishedAt: twitch.publishedAt,
    },
    warnings,
  });
});
