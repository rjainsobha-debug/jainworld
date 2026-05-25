import {
  createId,
  clampText,
  containsUrl,
  errorResponse,
  hasDb,
  isLikelyRepeatedSpam,
  jsonResponse,
  normalizeBoolean,
  normalizeString,
  normalizeWhitespace,
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
  const rateLimit = await checkRateLimit(context.request, context.env, "community-submit", 5, 3600);
  if (!rateLimit.ok) {
    return errorResponse(rateLimit.error, 429);
  }

  const name = clampText(payload.name, 120);
  const email = clampText(payload.email, 180);
  const mobile = clampText(payload.mobile, 30);
  const city = clampText(payload.city, 120);
  const country = clampText(payload.country, 120);
  const joinAs = clampText(payload.join_as, 120);
  const preferredLanguage = clampText(payload.preferred_language, 80);
  const contributionInterest = clampText(payload.contribution_interest, 240);
  const whatsappConsent = normalizeBoolean(payload.whatsapp_consent);
  const privacyConsent = normalizeBoolean(payload.privacy_consent);
  const website = normalizeString(payload.website);
  const turnstileToken = normalizeString(payload.turnstile_token);

  if (website) {
    return errorResponse("Spam submission blocked.", 400);
  }

  if (containsUrl(name)) {
    return errorResponse("Please enter a valid name.", 400);
  }

  if (isLikelyRepeatedSpam(name, city, country)) {
    return errorResponse("Please review your submission and try again.", 400);
  }

  if (!name) {
    return errorResponse("Name is required.", 400);
  }

  if (!email && !mobile) {
    return errorResponse("Email or mobile is required.", 400);
  }

  if (!privacyConsent) {
    return errorResponse("Privacy consent is required.", 400);
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

  const id = createId("community");

  try {
    await context.env.DB.prepare(
      `INSERT INTO community_submissions (
        id, name, email, mobile, city, country, join_as, preferred_language,
        contribution_interest, whatsapp_consent, privacy_consent, review_status,
        risk_notes, created_at, reviewed_at, reviewed_by
      ) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10, ?11, ?12, ?13, ?14, NULL, NULL)`
    )
      .bind(
        id,
        name,
        email || null,
        mobile || null,
        city || null,
        country || null,
        joinAs || null,
        preferredLanguage || null,
        contributionInterest || null,
        whatsappConsent ? 1 : 0,
        privacyConsent ? 1 : 0,
        "pending_review",
        "",
        nowIso()
      )
      .run();
  } catch (error) {
    return errorResponse("Could not store your request right now.", 500);
  }

  return jsonResponse({
    ok: true,
    success: true,
    id,
    message: "Your request has been received for review."
  });
}
