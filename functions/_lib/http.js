export function jsonResponse(data, status = 200, extraHeaders = {}) {
  return new Response(JSON.stringify(data, null, 2), {
    status,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": "no-store",
      ...extraHeaders
    }
  });
}

export function errorResponse(message, status = 400) {
  return jsonResponse(
    {
      ok: false,
      error: String(message || "Request failed.")
    },
    status
  );
}

export function json(data, status = 200, extraHeaders = {}) {
  return jsonResponse(data, status, extraHeaders);
}

export function hasDb(env) {
  return Boolean(env && env.DB);
}

export function nowIso() {
  return new Date().toISOString();
}

export function createId(prefix = "jw") {
  return `${prefix}-${crypto.randomUUID()}`;
}

export function normalizeString(value) {
  const normalized = String(value ?? "").trim();
  return normalized || "";
}

export function normalizeWhitespace(value) {
  return normalizeString(value).replace(/\s+/g, " ");
}

export function normalizeBoolean(value) {
  if (typeof value === "boolean") {
    return value;
  }

  return ["true", "1", "yes", "on"].includes(normalizeString(value).toLowerCase());
}

export async function readJson(request) {
  const contentType = normalizeString(request.headers.get("content-type")).toLowerCase();
  if (!contentType.includes("application/json")) {
    return {
      ok: false,
      error: "Content-Type must be application/json."
    };
  }

  try {
    return {
      ok: true,
      data: await request.json()
    };
  } catch (error) {
    return {
      ok: false,
      error: "Invalid JSON body."
    };
  }
}

export async function parseJsonBody(request) {
  const result = await readJson(request);
  return result.ok ? result.data : null;
}

export function requireMethod(request, method) {
  if (request.method !== method) {
    return errorResponse(`Method ${request.method} not allowed.`, 405);
  }

  return null;
}

export function getAdminTokenFromRequest(request) {
  return (
    request.headers.get("x-admin-token") ||
    request.headers.get("authorization")?.replace(/^Bearer\s+/i, "") ||
    ""
  );
}

export function requireAdminToken(request, env) {
  const accessModeEnabled = normalizeString(env?.ENABLE_ACCESS_AUTH).toLowerCase() === "true";
  const accessUserEmail = normalizeString(request.headers.get("cf-access-authenticated-user-email"));

  // TODO: In production, pair this with Cloudflare Access policies so these headers
  // are only present after verified Access authentication.
  if (accessModeEnabled && accessUserEmail) {
    return {
      ok: true,
      adminLabel: accessUserEmail,
      authMode: "cloudflare-access"
    };
  }

  const configuredToken = normalizeString(env?.ADMIN_TOKEN);
  if (!configuredToken) {
    return {
      ok: false,
      response: errorResponse("Admin review API is not configured.", 403)
    };
  }

  const requestToken = normalizeString(getAdminTokenFromRequest(request));
  if (!requestToken || requestToken !== configuredToken) {
    return {
      ok: false,
      response: errorResponse("Admin authorization failed.", 403)
    };
  }

  return {
    ok: true,
    adminLabel: "admin-token",
    authMode: "token"
  };
}

export function isAdminAuthorized(request, env) {
  const result = requireAdminToken(request, env);
  if (!result.ok) {
    return {
      ok: false,
      reason: "Admin authorization failed."
    };
  }

  return { ok: true };
}

export function safeLimit(value, fallback = 50, max = 100) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed <= 0) {
    return fallback;
  }

  return Math.min(Math.max(Math.floor(parsed), 1), max);
}

export function maskEmail(email) {
  const value = normalizeString(email);
  if (!value || !value.includes("@")) {
    return "";
  }

  const [localPart, domainPart] = value.split("@");
  if (!localPart || !domainPart) {
    return value;
  }

  if (localPart.length <= 2) {
    return `${localPart[0] || "*"}***@${domainPart}`;
  }

  return `${localPart.slice(0, 2)}***@${domainPart}`;
}

export function maskPhone(phone) {
  const value = normalizeString(phone);
  const digits = value.replace(/\D/g, "");

  if (!digits) {
    return "";
  }

  if (digits.length <= 4) {
    return value;
  }

  const prefix = digits.slice(0, Math.min(2, digits.length - 2));
  const suffix = digits.slice(-2);
  return `${prefix}${"X".repeat(Math.max(4, digits.length - prefix.length - suffix.length))}${suffix}`;
}

export function containsUrl(value) {
  return /(https?:\/\/|www\.)/i.test(normalizeString(value));
}

export function isLikelyRepeatedSpam(...values) {
  const normalized = values.map((value) => normalizeWhitespace(value).toLowerCase()).filter(Boolean);
  if (normalized.length < 2) {
    return false;
  }

  const unique = new Set(normalized);
  return unique.size === 1;
}

export function clampText(value, maxLength) {
  return normalizeWhitespace(value).slice(0, maxLength);
}

export async function verifyTurnstileToken(env, token, ipAddress = "") {
  const secret = normalizeString(env?.TURNSTILE_SECRET_KEY);
  if (!secret) {
    return {
      ok: true,
      enforced: false
    };
  }

  const turnstileToken = normalizeString(token);
  if (!turnstileToken) {
    return {
      ok: false,
      enforced: true,
      error: "Turnstile verification failed."
    };
  }

  try {
    const formData = new URLSearchParams();
    formData.set("secret", secret);
    formData.set("response", turnstileToken);
    if (ipAddress) {
      formData.set("remoteip", ipAddress);
    }

    const response = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded"
      },
      body: formData.toString()
    });

    const data = await response.json().catch(() => ({}));
    if (!response.ok || data.success !== true) {
      return {
        ok: false,
        enforced: true,
        error: "Turnstile verification failed."
      };
    }

    return {
      ok: true,
      enforced: true
    };
  } catch (error) {
    return {
      ok: false,
      enforced: true,
      error: "Turnstile verification failed."
    };
  }
}
