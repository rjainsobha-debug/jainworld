import { errorResponse, readJson, requireAdminToken, requireMethod } from "../_lib/http.js";
import { applyReviewAction } from "../_lib/review.js";

export async function onRequestPost(context) {
  const methodError = requireMethod(context.request, "POST");
  if (methodError) {
    return methodError;
  }

  const auth = requireAdminToken(context.request, context.env);
  if (!auth.ok) {
    return auth.response;
  }

  const parsed = await readJson(context.request);
  if (!parsed.ok) {
    return errorResponse(parsed.error, 400);
  }

  return applyReviewAction(context.env, parsed.data, "admin-token");
}
