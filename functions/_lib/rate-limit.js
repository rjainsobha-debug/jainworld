import { normalizeString, nowIso } from "./http.js";

export async function checkRateLimit(request, env, keyPrefix, limit, windowSeconds) {
  if (!env?.RATE_LIMIT_KV) {
    return {
      ok: true,
      enforced: false
    };
  }

  const ipAddress = normalizeString(request.headers.get("cf-connecting-ip")) || "unknown";
  const key = `${keyPrefix}:${ipAddress}`;
  const ttl = Math.max(Number(windowSeconds) || 0, 60);
  const maxRequests = Math.max(Number(limit) || 1, 1);

  try {
    const existingRaw = await env.RATE_LIMIT_KV.get(key);
    const existing = existingRaw ? JSON.parse(existingRaw) : null;
    const count = Number(existing?.count || 0);

    if (count >= maxRequests) {
      return {
        ok: false,
        enforced: true,
        error: "Too many requests. Please try again later.",
        retry_after: ttl
      };
    }

    await env.RATE_LIMIT_KV.put(
      key,
      JSON.stringify({
        count: count + 1,
        updated_at: nowIso()
      }),
      {
        expirationTtl: ttl
      }
    );

    return {
      ok: true,
      enforced: true
    };
  } catch (error) {
    return {
      ok: true,
      enforced: false
    };
  }
}
