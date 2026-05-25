import { hasDb, json, normalizeString, nowIso, parseJsonBody } from "../_lib/http.js";

export async function onRequestPost(context) {
  const payload = await parseJsonBody(context.request);
  if (!payload) {
    return json({ success: false, error: "Invalid JSON body." }, 400);
  }

  const correctionType = normalizeString(payload.correction_type);
  const relatedSlug = normalizeString(payload.related_slug);
  const relatedPage = normalizeString(payload.related_page);
  const title = normalizeString(payload.title);
  const description = normalizeString(payload.description);
  const sourceUrl = normalizeString(payload.source_url);
  const submittedByName = normalizeString(payload.submitted_by_name);
  const submittedByEmail = normalizeString(payload.submitted_by_email);

  if (!correctionType) {
    return json({ success: false, error: "correction_type is required." }, 400);
  }

  if (!description) {
    return json({ success: false, error: "description is required." }, 400);
  }

  if (!relatedPage && !relatedSlug) {
    return json({ success: false, error: "related_page or related_slug is required." }, 400);
  }

  if (!hasDb(context.env)) {
    return json({ success: false, error: "Database binding not configured." }, 503);
  }

  const id = crypto.randomUUID();
  await context.env.DB.prepare(
    `INSERT INTO correction_submissions (
      id, correction_type, related_slug, related_page, title, description, source_url,
      submitted_by_name, submitted_by_email, review_status, created_at, reviewed_at, reviewed_by
    ) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10, ?11, NULL, NULL)`
  )
    .bind(
      id,
      correctionType,
      relatedSlug,
      relatedPage,
      title,
      description,
      sourceUrl,
      submittedByName,
      submittedByEmail,
      "pending_review",
      nowIso()
    )
    .run();

  return json({
    success: true,
    id,
    review_status: "pending_review",
    message: "Correction submitted for review."
  });
}
