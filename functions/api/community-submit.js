import { hasDb, json, normalizeBoolean, normalizeString, nowIso, parseJsonBody } from "../_lib/http.js";

export async function onRequestPost(context) {
  const payload = await parseJsonBody(context.request);
  if (!payload) {
    return json({ success: false, error: "Invalid JSON body." }, 400);
  }

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
    return json({ success: false, error: "Spam submission blocked." }, 400);
  }

  if (!name) {
    return json({ success: false, error: "Name is required." }, 400);
  }

  if (!email && !mobile) {
    return json({ success: false, error: "Email or mobile is required." }, 400);
  }

  if (!privacyConsent) {
    return json({ success: false, error: "Privacy consent is required." }, 400);
  }

  if (!hasDb(context.env)) {
    return json({ success: false, error: "Database binding not configured." }, 503);
  }

  const id = crypto.randomUUID();
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
      email,
      mobile,
      city,
      country,
      joinAs,
      preferredLanguage,
      contributionInterest,
      whatsappConsent ? 1 : 0,
      privacyConsent ? 1 : 0,
      "pending_review",
      "",
      nowIso()
    )
    .run();

  return json({
    success: true,
    id,
    review_status: "pending_review",
    message:
      "Thank you. Your request has been received. The JainWorld team will review it and contact you if more details are needed."
  });
}
