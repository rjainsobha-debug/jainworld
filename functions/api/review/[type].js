import { isAdminAuthorized, json } from "../../_lib/http.js";
import { readReviewItems } from "../../_lib/review.js";

export async function onRequestGet(context) {
  const auth = isAdminAuthorized(context.request, context.env);
  if (!auth.ok) {
    return json({ ok: false, error: auth.reason }, 403);
  }

  const type = context.params?.type || "";
  return readReviewItems(context.env, type);
}
