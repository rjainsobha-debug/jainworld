import { errorResponse, hasDb, jsonResponse } from "../_lib/http.js";
import { buildResult, buildSearchResponse, logSearchQuery, normalizeType, resolveSearchParams, safePublicStatus } from "../_lib/search.js";

const TABLES = [
  {
    type: "resources",
    table: "resources",
    columns: "id, title, slug, category, summary, state, official_url, source_name, last_verified_at, review_status, status, created_at"
  },
  {
    type: "news",
    table: "news_items",
    columns: "id, title, slug, category, summary, region, source_name, source_url, canonical_url, review_status, status, created_at, published_at"
  },
  {
    type: "audio",
    table: "audio_items",
    columns: "id, title, slug, category, language, duration, source, review_status, status, created_at"
  }
];

export async function onRequestGet(context) {
  const url = new URL(context.request.url);
  const { query, type, limit } = resolveSearchParams(url);

  if (query.length > 120) {
    return errorResponse("Search query is too long.", 400);
  }

  if (!query) {
    return jsonResponse({
      ok: true,
      query: "",
      type,
      results: [],
      count: 0,
      logged: false
    });
  }

  if (!hasDb(context.env)) {
    return errorResponse("Search service is not available right now.", 503);
  }

  const selectedTables = type === "all" ? TABLES : TABLES.filter((entry) => entry.type === normalizeType(type));
  const results = [];

  for (const entry of selectedTables) {
    try {
      const rows = await searchTable(context.env.DB, entry, query, limit);
      rows
        .filter((row) => safePublicStatus(row))
        .map((row) => buildResult(entry.type, row, query))
        .forEach((row) => results.push(row));
    } catch (error) {
      // Keep search resilient when a D1 table is missing or unavailable.
    }
  }

  const sortedResults = results.sort((left, right) => right.score - left.score).slice(0, limit);
  const logged = await logSearchQuery(context.env, {
    query,
    type,
    result_count: sortedResults.length,
    source: "pages-search"
  });

  return jsonResponse(buildSearchResponse(query, type, sortedResults, logged));
}

async function searchTable(db, entry, query, limit) {
  const normalized = `%${query.toLowerCase()}%`;
  const sql = `
    SELECT ${entry.columns}
    FROM ${entry.table}
    WHERE (
      lower(coalesce(title, '')) LIKE ?1 OR
      lower(coalesce(summary, '')) LIKE ?1 OR
      lower(coalesce(category, '')) LIKE ?1 OR
      lower(coalesce(slug, '')) LIKE ?1
    )
    ORDER BY created_at DESC
    LIMIT ?2
  `;
  const result = await db.prepare(sql).bind(normalized, limit).all();
  return Array.isArray(result?.results) ? result.results : [];
}
