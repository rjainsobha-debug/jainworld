import { json, maskEmail, maskPhone, normalizeString, nowIso } from "./http.js";

export const REVIEW_TYPE_MAP = {
  news: {
    table: "news_items",
    statusColumn: "review_status",
    idColumn: "id",
    publicColumns:
      "id, title, slug, summary, source_name, source_url, canonical_url, duplicate_group_id, content_hash, category, region, relevance_score, review_status, status, created_at, published_at, reviewed_at, reviewed_by"
  },
  resources: {
    table: "resources",
    statusColumn: "review_status",
    idColumn: "id",
    publicColumns:
      "id, title, slug, category, summary, official_url, source_name, state, last_verified_at, review_status, status, created_at, reviewed_at, reviewed_by"
  },
  audio: {
    table: "audio_items",
    statusColumn: "review_status",
    idColumn: "id",
    publicColumns:
      "id, title, slug, category, speaker, singer, tradition, language, duration, source, permission_status, verified_status, review_status, status, created_at, reviewed_at, reviewed_by"
  },
  "temple-corrections": {
    table: "temple_corrections",
    statusColumn: "review_status",
    idColumn: "id",
    publicColumns:
      "id, temple_slug, correction_category, current_value, suggested_value, source_url, submitted_by_name, review_status, priority, created_at, reviewed_at, reviewed_by"
  },
  community: {
    table: "community_submissions",
    statusColumn: "review_status",
    idColumn: "id",
    publicColumns:
      "id, name, email, mobile, city, country, join_as, preferred_language, contribution_interest, whatsapp_consent, privacy_consent, review_status, risk_notes, created_at, reviewed_at, reviewed_by"
  },
  images: {
    table: "image_assets",
    statusColumn: "review_status",
    idColumn: "id",
    publicColumns:
      "id, related_type, related_slug, image_url, alt_text, caption, source, license_status, review_status, created_at, reviewed_at, reviewed_by"
  }
};

const ACTION_STATUS_MAP = {
  approve: "approved",
  reject: "rejected",
  needs_update: "needs_update",
  archive: "archived",
  publish: "published"
};

export function getReviewTypeConfig(type) {
  return REVIEW_TYPE_MAP[String(type || "").trim().toLowerCase()] || null;
}

export function getMappedStatus(action) {
  return ACTION_STATUS_MAP[String(action || "").trim().toLowerCase()] || "";
}

export async function readReviewItems(env, type) {
  const config = getReviewTypeConfig(type);
  if (!config) {
    return json({ ok: false, error: "Unsupported review type." }, 400);
  }

  if (!env?.DB) {
    return json({ ok: false, error: "Database binding not configured." }, 503);
  }

  const statement = env.DB.prepare(
    `SELECT ${config.publicColumns} FROM ${config.table} ORDER BY created_at DESC LIMIT 100`
  );
  const result = await statement.all();
  const items = Array.isArray(result?.results) ? result.results.map((row) => sanitizeRow(type, row)) : [];

  return json({
    ok: true,
    type,
    count: items.length,
    items
  });
}

export async function applyReviewAction(env, payload, adminEmail = "token-admin") {
  const itemType = normalizeString(payload?.item_type).toLowerCase();
  const itemId = normalizeString(payload?.item_id);
  const action = normalizeString(payload?.action).toLowerCase();
  const notes = normalizeString(payload?.notes);
  const mappedStatus = getMappedStatus(action);
  const config = getReviewTypeConfig(itemType);

  if (!config) {
    return json({ ok: false, error: "Unsupported item_type." }, 400);
  }

  if (!itemId) {
    return json({ ok: false, error: "item_id is required." }, 400);
  }

  if (!mappedStatus) {
    return json({ ok: false, error: "Unsupported action." }, 400);
  }

  if (!env?.DB) {
    return json({ ok: false, error: "Database binding not configured." }, 503);
  }

  const fetchExisting = await env.DB.prepare(
    `SELECT ${config.statusColumn} as review_status FROM ${config.table} WHERE ${config.idColumn} = ?1 LIMIT 1`
  )
    .bind(itemId)
    .first();

  if (!fetchExisting) {
    return json({ ok: false, error: "Review item not found." }, 404);
  }

  const previousStatus = String(fetchExisting.review_status || "");
  await env.DB.prepare(
    `UPDATE ${config.table} SET ${config.statusColumn} = ?1, reviewed_at = ?2, reviewed_by = ?3 WHERE ${config.idColumn} = ?4`
  )
    .bind(mappedStatus, nowIso(), adminEmail, itemId)
    .run();

  await env.DB.prepare(
    `INSERT INTO review_logs (id, item_type, item_id, action, previous_status, new_status, admin_email, notes, created_at)
     VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9)`
  )
    .bind(
      crypto.randomUUID(),
      itemType,
      itemId,
      action,
      previousStatus,
      mappedStatus,
      adminEmail,
      notes,
      nowIso()
    )
    .run();

  return json({
    ok: true,
    item_type: itemType,
    item_id: itemId,
    previous_status: previousStatus,
    new_status: mappedStatus
  });
}

function sanitizeRow(type, row) {
  if (type !== "community") {
    return row;
  }

  return {
    ...row,
    email: maskEmail(row.email),
    mobile: maskPhone(row.mobile)
  };
}
