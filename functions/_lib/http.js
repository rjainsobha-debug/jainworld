export function json(data, status = 200, extraHeaders = {}) {
  return new Response(JSON.stringify(data, null, 2), {
    status,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": "no-store",
      ...extraHeaders
    }
  });
}

export async function parseJsonBody(request) {
  try {
    return await request.json();
  } catch (error) {
    return null;
  }
}

export function hasDb(env) {
  return Boolean(env && env.DB);
}

export function getAdminTokenFromRequest(request) {
  return request.headers.get("x-admin-token") || request.headers.get("authorization")?.replace(/^Bearer\s+/i, "") || "";
}

export function isAdminAuthorized(request, env) {
  const configuredToken = String(env?.ADMIN_TOKEN || "").trim();
  if (!configuredToken) {
    return {
      ok: false,
      reason: "Admin review API is not configured."
    };
  }

  const requestToken = String(getAdminTokenFromRequest(request) || "").trim();
  if (!requestToken || requestToken !== configuredToken) {
    return {
      ok: false,
      reason: "Admin authorization failed."
    };
  }

  return { ok: true };
}

export function nowIso() {
  return new Date().toISOString();
}

export function normalizeBoolean(value) {
  if (typeof value === "boolean") {
    return value;
  }

  return ["true", "1", "yes", "on"].includes(String(value || "").trim().toLowerCase());
}

export function normalizeString(value) {
  return String(value ?? "").trim();
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
