import {
  createId,
  clampText,
  containsUrl,
  errorResponse,
  hasDb,
  isLikelyRepeatedSpam,
  jsonResponse,
  normalizeString,
  nowIso,
  readJson,
  requireMethod
} from "../_lib/http.js";
import { checkRateLimit } from "../_lib/rate-limit.js";
import { verifyTurnstileToken } from "../_lib/http.js";

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
  const rateLimit = await checkRateLimit(context.request, context.env, "correction-submit", 10, 3600);
  if (!rateLimit.ok) {
    return errorResponse(rateLimit.error, 429);
  }

  const correctionType = clampText(payload.correction_type, 120);
  const relatedSlug = clampText(payload.related_slug, 180);
  const relatedPage = clampText(payload.related_page, 300);
  const title = clampText(payload.title, 180);
  const description = clampText(payload.description, 2000);
  const sourceUrl = clampText(payload.source_url, 300);
  const submittedByName = clampText(payload.submitted_by_name, 120);
  const submittedByEmail = clampText(payload.submitted_by_email, 180);
  const templeSlug = clampText(payload.temple_slug || relatedSlug, 180);
  const currentValue = clampText(payload.current_value, 500);
  const suggestedValue = clampText(payload.suggested_value, 1000);
  const turnstileToken = normalizeString(payload.turnstile_token);

  if (!correctionType) {
    return errorResponse("correction_type is required.", 400);
  }

  if (!description) {
    return errorResponse("description is required.", 400);
  }

  if (description.length < 20) {
    return errorResponse("Please provide a little more detail so the correction can be reviewed.", 400);
  }

  if (!relatedPage && !relatedSlug) {
    return errorResponse("related_page or related_slug is required.", 400);
  }

  if (containsUrl(submittedByName)) {
    return errorResponse("Please enter a valid name.", 400);
  }

  if (isLikelyRepeatedSpam(description, title, submittedByName)) {
    return errorResponse("Please review your correction details and try again.", 400);
  }

  const turnstile = await verifyTurnstileToken(
    context.env,
    turnstileToken,
    normalizeString(context.request.headers.get("cf-connecting-ip"))
  );
  if (!turnstile.ok) {
    return errorResponse(turnstile.error, 403);
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
