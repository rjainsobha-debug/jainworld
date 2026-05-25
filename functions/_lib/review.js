import { createId, errorResponse, jsonResponse, maskEmail, maskPhone, normalizeString, nowIso, safeLimit } from "./http.js";

export const REVIEW_TYPE_MAP = {
  community: {
    table: "community_submissions",
    reviewColumn: "review_status",
    idColumn: "id",
    selectColumns:
      "id, name, city, country, join_as, preferred_language, contribution_interest, whatsapp_consent, privacy_consent, review_status, risk_notes, created_at, reviewed_at, reviewed_by, email, mobile"
  },
  corrections: {
    table: "correction_submissions",
    reviewColumn: "review_status",
    idColumn: "id",
    selectColumns:
      "id, correction_type, related_slug, related_page, title, description, source_url, submitted_by_name, submitted_by_email, review_status, created_at, reviewed_at, reviewed_by"
  },
  news: {
    table: "news_items",
    reviewColumn: "review_status",
    statusColumn: "status",
    idColumn: "id",
    selectColumns:
      "id, title, slug, summary, source_name, source_url, canonical_url, duplicate_group_id, content_hash, category, region, relevance_score, review_status, status, created_at, published_at, reviewed_at, reviewed_by"
  },
  resources: {
    table: "resources",
    reviewColumn: "review_status",
    statusColumn: "status",
    idColumn: "id",
    selectColumns:
      "id, title, slug, category, summary, official_url, source_name, state, last_verified_at, review_status, status, created_at, reviewed_at, reviewed_by"
  },
  audio: {
    table: "audio_items",
    reviewColumn: "review_status",
    statusColumn: "status",
    idColumn: "id",
    selectColumns:
      "id, title, slug, category, speaker, singer, tradition, language, duration, source, permission_status, verified_status, review_status, status, created_at, reviewed_at, reviewed_by"
  },
  "temple-corrections": {
    table: "temple_corrections",
    reviewColumn: "review_status",
    idColumn: "id",
    selectColumns:
      "id, temple_slug, correction_category, current_value, suggested_value, source_url, submitted_by_name, submitted_by_email, review_status, priority, created_at, reviewed_at, reviewed_by"
  },
  images: {
    table: "image_assets",
    reviewColumn: "review_status",
    idColumn: "id",
    selectColumns:
      "id, related_type, related_slug, image_url, alt_text, caption, source, license_status, review_status, created_at, reviewed_at, reviewed_by"
  },
  ask: {
    table: "ask_review_queue",
    reviewColumn: "review_status",
    idColumn: "id",
    selectColumns:
      "id, question, reason, safety_level, review_status, created_at, reviewed_at, reviewed_by"
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
  return REVIEW_TYPE_MAP[normalizeString(type).toLowerCase()] || null;
}

export function getMappedStatus(action) {
  return ACTION_STATUS_MAP[normalizeString(action).toLowerCase()] || "";
}

export async function readReviewItems(env, type, query = new URLSearchParams()) {
  const config = getReviewTypeConfig(type);
  if (!config) {
    return errorResponse("Unsupported review type.", 400);
  }

  if (!env?.DB) {
    return errorResponse("Database binding not configured.", 503);
  }

  const status = normalizeString(query.get("status")).toLowerCase();
  const limit = safeLimit(query.get("limit"), 50, 100);
  const bindings = [];
  let sql = `SELECT ${config.selectColumns} FROM ${config.table}`;

  if (status) {
    sql += ` WHERE ${config.reviewColumn} = ?1`;
    bindings.push(status);
  }

  sql += ` ORDER BY created_at DESC LIMIT ?${bindings.length + 1}`;
  bindings.push(limit);

  let items = [];
  try {
    const statement = env.DB.prepare(sql).bind(...bindings);
    const result = await statement.all();
    items = Array.isArray(result?.results) ? result.results.map((row) => sanitizeRow(type, row)) : [];
  } catch (error) {
    return errorResponse("Could not load the review queue right now.", 500);
  }

  return jsonResponse({
    ok: true,
    type,
    items
  });
}

export async function applyReviewAction(env, payload, adminLabel = "token-admin") {
  const itemType = normalizeString(payload?.item_type).toLowerCase();
  const itemId = normalizeString(payload?.item_id);
  const action = normalizeString(payload?.action).toLowerCase();
  const notes = normalizeString(payload?.notes);
  const mappedStatus = getMappedStatus(action);
  const config = getReviewTypeConfig(itemType);

  if (!config) {
    return errorResponse("Unsupported item_type.", 400);
  }

  if (!itemId) {
    return errorResponse("item_id is required.", 400);
  }

  if (!mappedStatus) {
    return errorResponse("Unsupported action.", 400);
  }

  if (!env?.DB) {
    return errorResponse("Database binding not configured.", 503);
  }

  let existing;
  try {
    existing = await env.DB.prepare(
      `SELECT ${config.reviewColumn} AS review_status${config.statusColumn ? `, ${config.statusColumn} AS status` : ""}
       FROM ${config.table}
       WHERE ${config.idColumn} = ?1
       LIMIT 1`
    )
      .bind(itemId)
      .first();
  } catch (error) {
    return errorResponse("Could not load this review item right now.", 500);
  }

  if (!existing) {
    return errorResponse("Review item not found.", 404);
  }

  const previousStatus = normalizeString(existing.review_status || existing.status);
  const reviewedAt = nowIso();
  const isPublishAction = action === "publish" && config.statusColumn;

  try {
    if (isPublishAction) {
      await env.DB.prepare(
        `UPDATE ${config.table}
         SET ${config.statusColumn} = ?1, ${config.reviewColumn} = ?2, reviewed_at = ?3, reviewed_by = ?4
         WHERE ${config.idColumn} = ?5`
      )
        .bind("published", "approved", reviewedAt, adminLabel, itemId)
        .run();
    } else {
      await env.DB.prepare(
        `UPDATE ${config.table}
         SET ${config.reviewColumn} = ?1, reviewed_at = ?2, reviewed_by = ?3
         WHERE ${config.idColumn} = ?4`
      )
        .bind(mappedStatus, reviewedAt, adminLabel, itemId)
        .run();
    }

    await env.DB.prepare(
      `INSERT INTO review_logs (id, item_type, item_id, action, previous_status, new_status, admin_email, notes, created_at)
       VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9)`
    )
      .bind(
        createId("review-log"),
        itemType,
        itemId,
        action,
        previousStatus,
        mappedStatus,
        adminLabel,
        notes,
        reviewedAt
      )
      .run();
  } catch (error) {
    return errorResponse("Could not save this review action right now.", 500);
  }

  return jsonResponse({
    ok: true,
    message: "Review action saved.",
    item_type: itemType,
    item_id: itemId,
    previous_status: previousStatus,
    new_status: mappedStatus
  });
}

function sanitizeRow(type, row) {
  if (type === "community") {
    const { email, mobile, ...rest } = row;
    return {
      ...rest,
      masked_email: maskEmail(email),
      masked_mobile: maskPhone(mobile)
    };
  }

  if (type === "corrections" || type === "temple-corrections") {
    const { submitted_by_email, ...rest } = row;
    return {
      ...rest,
      masked_email: maskEmail(submitted_by_email)
    };
  }

  return row;
}
