import { errorResponse, jsonResponse, normalizeString, requireAdminToken, requireMethod, safeLimit } from "../_lib/http.js";

export async function onRequestGet(context) {
  const methodError = requireMethod(context.request, "GET");
  if (methodError) {
    return methodError;
  }

  const authError = requireAdminToken(context.request, context.env);
  if (authError) {
    return authError;
  }

  if (!context.env?.DB) {
    return errorResponse("Database binding not configured.", 503);
  }

  const url = new URL(context.request.url);
  const status = normalizeString(url.searchParams.get("status")).toLowerCase();
  const limit = safeLimit(url.searchParams.get("limit"), 30, 100);
  const bindings = [];
  let sql = `
    SELECT id, question, normalized_question, detected_intent, missing_topic, source_count,
           frequency_count, last_asked_at, first_asked_at, status, priority, admin_notes
    FROM content_gaps
  `;

  if (status) {
    sql += " WHERE status = ?1";
    bindings.push(status);
  }

  sql += ` ORDER BY frequency_count DESC, last_asked_at DESC LIMIT ?${bindings.length + 1}`;
  bindings.push(limit);

  try {
    const result = await context.env.DB.prepare(sql).bind(...bindings).all();
    return jsonResponse({
      ok: true,
      items: Array.isArray(result?.results) ? result.results : []
    });
  } catch (error) {
    return errorResponse("Could not load content gaps right now.", 500);
  }
}
