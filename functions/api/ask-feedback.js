import { createId, errorResponse, hasDb, jsonResponse, normalizeString, nowIso, readJson, requireMethod } from "../_lib/http.js";

const ALLOWED_FEEDBACK = new Set(["helpful", "not_helpful", "needs_correction"]);

export async function onRequestPost(context) {
  const methodError = requireMethod(context.request, "POST");
  if (methodError) {
    return methodError;
  }

  const body = await readJson(context.request);
  if (!body.ok) {
    return errorResponse(body.error, 400);
  }

  const askQueryId = normalizeString(body.data?.ask_query_id);
  const question = normalizeString(body.data?.question).slice(0, 500);
  const feedback = normalizeString(body.data?.feedback).toLowerCase();
  const notes = normalizeString(body.data?.notes).slice(0, 800);

  if (!askQueryId && !question) {
    return errorResponse("ask_query_id or question is required.", 400);
  }

  if (!ALLOWED_FEEDBACK.has(feedback)) {
    return errorResponse("Unsupported feedback value.", 400);
  }

  if (!hasDb(context.env)) {
    return errorResponse("Feedback storage is not available right now.", 503);
  }

  const createdAt = nowIso();

  try {
    await context.env.DB.prepare(
      `INSERT INTO ask_feedback (id, ask_query_id, question, feedback, notes, created_at)
       VALUES (?1, ?2, ?3, ?4, ?5, ?6)`
    )
      .bind(createId("ask-feedback"), askQueryId || null, question || null, feedback, notes || null, createdAt)
      .run();

    if (feedback === "needs_correction") {
      await context.env.DB.prepare(
        `INSERT INTO ask_review_queue (id, question, reason, safety_level, review_status, created_at, reviewed_at, reviewed_by)
         VALUES (?1, ?2, ?3, 'high_review', 'pending_review', ?4, NULL, NULL)`
      )
        .bind(
          createId("ask-review"),
          question || "Feedback-linked Ask JainWorld response",
          "User marked the Ask JainWorld response as needing correction.",
          createdAt
        )
        .run();
    }
  } catch (error) {
    return errorResponse("Could not save feedback right now.", 500);
  }

  return jsonResponse({
    ok: true,
    message: "Feedback received. Thank you for helping improve JainWorld."
  });
}
