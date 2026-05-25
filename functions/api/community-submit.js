import {
  createId,
  errorResponse,
  hasDb,
  jsonResponse,
  normalizeBoolean,
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

  const name = normalizeString(payload.name);
  const email = normalizeString(payload.email);
  const mobile = normalizeString(payload.mobile);
  const city = normalizeString(payload.city);
  const country = normalizeString(payload.country);
  const joinAs = normalizeString(payload.join_as);
  const preferredLanguage = normalizeString(payload.preferred_language);
  const contributionInterest = normalizeString(payload.contribution_interest);
  const whatsappConsent = normalizeBoolean(payload.whatsapp_consent);
  const privacyConsent = normalizeBoolean(payload.privacy_consent);
  const website = normalizeString(payload.website);

  if (website) {
    return errorResponse("Spam submission blocked.", 400);
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
