import { isAdminAuthorized, json, parseJsonBody } from "../_lib/http.js";
import { applyReviewAction } from "../_lib/review.js";

export async function onRequestPost(context) {
  const auth = isAdminAuthorized(context.request, context.env);
  if (!auth.ok) {
    return json({ ok: false, error: auth.reason }, 403);
  }

  const payload = await parseJsonBody(context.request);
  if (!payload) {
    return json({ ok: false, error: "Invalid JSON body." }, 400);
  }

  return applyReviewAction(context.env, payload, "token-admin");
}
