import { errorResponse, hasDb, jsonResponse } from "../_lib/http.js";
import {
  buildResult,
  buildSearchResponse,
  expandQueryVariants,
  indexTypeToPublicType,
  logSearchQuery,
  normalizeType,
  resolveSearchParams,
  safePublicStatus
} from "../_lib/search.js";

const LEGACY_TABLES = [
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

  let results = [];

  try {
    results = await searchIndex(context.env.DB, query, type, limit);
  } catch (error) {
    results = [];
  }

  if (!results.length) {
    results = await searchLegacyTables(context.env.DB, query, type, limit);
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

async function searchIndex(db, query, type, limit) {
  const variants = expandQueryVariants(query);
  const tokens = variants.tokens.length ? variants.tokens : [variants.normalized].filter(Boolean);
  const bindings = [];
  let typeClause = "";
  let nextPosition = 1;

  if (type !== "all") {
    typeClause = ` AND content_type = ?${nextPosition}`;
    bindings.push(type);
    nextPosition += 1;
  }

  const searchableColumns = [
    "lower(coalesce(title, ''))",
    "lower(coalesce(summary, ''))",
    "lower(coalesce(body, ''))",
    "lower(coalesce(category, ''))",
    "lower(coalesce(tags, ''))",
    "lower(coalesce(source_name, ''))"
  ];

  const tokenClauses = tokens
    .map((token) => {
      const binding = `%${token}%`;
      const comparisons = searchableColumns.map((column) => `${column} LIKE ?${nextPosition}`).join(" OR ");
      bindings.push(binding);
      nextPosition += 1;
      return `(${comparisons})`;
    })
    .join(" OR ");

  bindings.push(Math.max(limit * 6, 60));
  const limitPosition = `?${nextPosition}`;
  const sql = `
    SELECT id, content_type, source_id, title, summary, body, url, category, tags, language, status, review_status,
           source_name, published_at, updated_at, search_weight, created_at
    FROM search_index
    WHERE status = 'published'
      AND (review_status IN ('verified', 'approved', 'published') OR review_status IS NULL OR review_status = '')
      ${typeClause}
      AND (${tokenClauses || "1 = 0"})
    ORDER BY coalesce(updated_at, published_at, created_at) DESC
    LIMIT ${limitPosition}
  `;

  const result = await db.prepare(sql).bind(...bindings).all();
  const rows = Array.isArray(result?.results) ? result.results : [];
  return rows
    .map((row) => buildResult(indexTypeToPublicType(row.content_type), row, query))
    .filter((row) => safePublicStatus(row))
    .filter((row) => row.score > 0);
}

async function searchLegacyTables(db, query, type, limit) {
  const selectedTables = type === "all" ? LEGACY_TABLES : LEGACY_TABLES.filter((entry) => entry.type === normalizeType(type));
  const results = [];

  for (const entry of selectedTables) {
    try {
      const rows = await searchLegacyTable(db, entry, query, limit);
      rows
        .filter((row) => safePublicStatus(row))
        .map((row) => buildResult(entry.type, row, query))
        .forEach((row) => results.push(row));
    } catch (error) {
      // Keep search resilient if legacy tables are missing.
    }
  }

  return results;
}

async function searchLegacyTable(db, entry, query, limit) {
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
