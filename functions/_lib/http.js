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

  return { ok: true };
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
