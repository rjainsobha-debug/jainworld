import { requireAdminToken } from "../../_lib/http.js";
import { readReviewItems } from "../../_lib/review.js";

export async function onRequestGet(context) {
  const auth = requireAdminToken(context.request, context.env);
  if (!auth.ok) {
    return auth.response;
  }

  const type = context.params?.type || "";
  const url = new URL(context.request.url);
  return readReviewItems(context.env, type, url.searchParams);
}
