import { hasDb, json, nowIso } from "../_lib/http.js";

export async function onRequestGet(context) {
  return json({
    ok: true,
    service: "jainworld-api",
    time: nowIso(),
    d1_bound: hasDb(context.env)
  });
}
