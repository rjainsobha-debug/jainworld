import {
  createId,
  errorResponse,
  hasDb,
  jsonResponse,
  normalizeString,
  nowIso,
  readJson,
  requireMethod
} from "../_lib/http.js";

export async function onRequestPost(context) {
  const methodError = requireMethod(context.request, "POST");
  if (methodError) {
    return methodError;
  }

  const parsed = await readJson(context.request);
  if (!parsed.ok) {
    return errorResponse(parsed.error, 400);
  }
  const payload = parsed.data;

  const correctionType = normalizeString(payload.correction_type);
  const relatedSlug = normalizeString(payload.related_slug);
  const relatedPage = normalizeString(payload.related_page);
  const title = normalizeString(payload.title);
  const description = normalizeString(payload.description);
  const sourceUrl = normalizeString(payload.source_url);
  const submittedByName = normalizeString(payload.submitted_by_name);
  const submittedByEmail = normalizeString(payload.submitted_by_email);
  const templeSlug = normalizeString(payload.temple_slug || relatedSlug);
  const currentValue = normalizeString(payload.current_value);
  const suggestedValue = normalizeString(payload.suggested_value);

  if (!correctionType) {
    return errorResponse("correction_type is required.", 400);
  }

  if (!description) {
    return errorResponse("description is required.", 400);
  }

  if (!relatedPage && !relatedSlug) {
    return errorResponse("related_page or related_slug is required.", 400);
  }

  if (!hasDb(context.env)) {
    return errorResponse("Database binding not configured.", 503);
  }

  const id = createId("correction");
  const createdAt = nowIso();

  try {
    await context.env.DB.prepare(
      `INSERT INTO correction_submissions (
        id, correction_type, related_slug, related_page, title, description, source_url,
        submitted_by_name, submitted_by_email, review_status, created_at, reviewed_at, reviewed_by
      ) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10, ?11, NULL, NULL)`
    )
      .bind(
        id,
        correctionType,
        relatedSlug || null,
        relatedPage || null,
        title || null,
        description,
        sourceUrl || null,
        submittedByName || null,
        submittedByEmail || null,
        "pending_review",
        createdAt
      )
      .run();

    const isTempleRelated =
      Boolean(templeSlug) ||
      relatedPage.toLowerCase().includes("temple") ||
      correctionType.toLowerCase().includes("timing") ||
      correctionType.toLowerCase().includes("dharamshala") ||
      correctionType.toLowerCase().includes("bhojanshala") ||
      correctionType.toLowerCase().includes("map") ||
      correctionType.toLowerCase().includes("photo") ||
      correctionType.toLowerCase().includes("address");

    if (isTempleRelated && templeSlug) {
      await context.env.DB.prepare(
        `INSERT INTO temple_corrections (
          id, temple_slug, correction_category, current_value, suggested_value, source_url,
          submitted_by_name, submitted_by_email, review_status, priority, created_at, reviewed_at, reviewed_by
        ) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10, ?11, NULL, NULL)`
      )
        .bind(
          createId("temple-correction"),
          templeSlug,
          correctionType,
          currentValue || null,
          suggestedValue || description,
          sourceUrl || null,
          submittedByName || null,
          submittedByEmail || null,
          "pending_review",
          "medium",
          createdAt
        )
        .run();
    }
  } catch (error) {
    return errorResponse("Could not store this correction right now.", 500);
  }

  return jsonResponse({
    ok: true,
    success: true,
    id,
    message: "Your correction has been received for review."
  });
}
