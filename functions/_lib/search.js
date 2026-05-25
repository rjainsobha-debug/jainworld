import { createId, normalizeString, nowIso, safeLimit } from "./http.js";

const PUBLIC_STATUS = new Set(["published", "active"]);
const PUBLIC_REVIEW_STATUS = new Set(["approved", "verified", "published", ""]);

export function normalizeQuery(text) {
  return normalizeString(text)
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s-]/gu, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function tokenize(text) {
  return normalizeQuery(text)
    .split(" ")
    .map((token) => token.trim())
    .filter(Boolean);
}

export function safePublicStatus(item) {
  const status = normalizeString(item.status).toLowerCase();
  const reviewStatus = normalizeString(item.review_status).toLowerCase();
  const statusOk = !status || PUBLIC_STATUS.has(status);
  const reviewOk = PUBLIC_REVIEW_STATUS.has(reviewStatus);
  return statusOk && reviewOk;
}

export function scoreItem(query, item) {
  const normalizedQuery = normalizeQuery(query);
  const tokens = tokenize(query);
  const title = normalizeQuery(item.title || "");
  const summary = normalizeQuery(item.summary || "");
  const category = normalizeQuery((item.meta || []).join(" "));
  let score = 0;

  if (!normalizedQuery) {
    return score;
  }

  if (title === normalizedQuery) {
    score += 120;
  }

  if (title.includes(normalizedQuery)) {
    score += 80;
  }

  if (category.includes(normalizedQuery)) {
    score += 40;
  }

  if (summary.includes(normalizedQuery)) {
    score += 25;
  }

  tokens.forEach((token) => {
    if (title.includes(token)) {
      score += 12;
    }
    if (summary.includes(token)) {
      score += 6;
    }
    if (category.includes(token)) {
      score += 8;
    }
  });

  if (item.type === "news") {
    score += boostRecent(item.created_at || item.published_at, 20);
  }

  if (item.type === "resources" && normalizeString(item.review_status).toLowerCase() === "verified") {
    score += 18;
  }

  if (item.type === "audio" && category.includes(normalizedQuery)) {
    score += 14;
  }

  if (item.type === "temples") {
    const location = normalizeQuery((item.meta || []).join(" "));
    if (location.includes(normalizedQuery)) {
      score += 18;
    }
  }

  return score;
}

export function makeSnippet(text, query) {
  const source = normalizeString(text);
  if (!source) {
    return "";
  }

  const lowered = source.toLowerCase();
  const queryValue = normalizeQuery(query);
  if (!queryValue) {
    return source.slice(0, 180);
  }

  const index = lowered.indexOf(queryValue);
  if (index === -1) {
    return source.slice(0, 180);
  }

  const start = Math.max(0, index - 60);
  const end = Math.min(source.length, index + queryValue.length + 120);
  const snippet = source.slice(start, end).trim();
  return `${start > 0 ? "..." : ""}${snippet}${end < source.length ? "..." : ""}`;
}

export function buildResult(type, item, query) {
  const mappedType = typeMap(type);
  const title =
    normalizeString(item.title) ||
    normalizeString(item.title_en) ||
    normalizeString(item.name_en) ||
    normalizeString(item.course_title_en) ||
    normalizeString(item.lesson_title_en) ||
    normalizeString(item.festival_en) ||
    "Untitled";
  const summary =
    normalizeString(item.summary) ||
    normalizeString(item.summary_en) ||
    normalizeString(item.description_en) ||
    normalizeString(item.content_en) ||
    normalizeString(item.history_en) ||
    normalizeString(item.meaning_en) ||
    normalizeString(item.description) ||
    "";
  const meta = buildMeta(mappedType, item);
  const result = {
    id: item.id || item.slug || createId("search-item"),
    type: mappedType,
    title,
    summary: makeSnippet(summary || title, query),
    url: buildUrl(mappedType, item),
    meta,
    score: 0,
    review_status: normalizeString(item.review_status),
    source_name: normalizeString(item.source_name || item.source || item.author)
  };
  result.score = scoreItem(query, result);
  return result;
}

export function buildSearchResponse(query, type, results, logged = false) {
  return {
    ok: true,
    query,
    type: type || "all",
    results: results.sort((left, right) => right.score - left.score),
    count: results.length,
    logged
  };
}

export async function logSearchQuery(env, payload) {
  if (!env?.DB) {
    return false;
  }

  try {
    await env.DB.prepare(
      `INSERT INTO search_queries (id, query, type, result_count, source, created_at, user_agent_hash, ip_hash)
       VALUES (?1, ?2, ?3, ?4, ?5, ?6, NULL, NULL)`
    )
      .bind(
        createId("search"),
        payload.query,
        payload.type || "all",
        Number(payload.result_count || 0),
        payload.source || "pages-search",
        nowIso()
      )
      .run();
    return true;
  } catch (error) {
    return false;
  }
}

export function resolveSearchParams(url) {
  const query = normalizeString(url.searchParams.get("q")).slice(0, 120);
  const type = normalizeType(url.searchParams.get("type"));
  const limit = safeLimit(url.searchParams.get("limit"), 20, 50);
  return { query, type, limit };
}

export function normalizeType(type) {
  const value = normalizeString(type).toLowerCase();
  const allowed = new Set(["all", "literature", "education", "temples", "food", "news", "blogs", "audio", "resources", "calendar"]);
  return allowed.has(value) ? value : "all";
}

function buildMeta(type, item) {
  if (type === "resources") {
    return [item.category, item.state, item.last_verified_at ? `Verified: ${item.last_verified_at}` : ""].filter(Boolean);
  }
  if (type === "news") {
    return [item.category, item.region, item.published_at || item.created_at].filter(Boolean);
  }
  if (type === "audio") {
    return [item.category, item.language, item.duration].filter(Boolean);
  }
  if (type === "temples") {
    return [item.city, item.state, item.country].filter(Boolean);
  }
  if (type === "education") {
    return [item.course_level, item.topic, item.difficulty].filter(Boolean);
  }
  if (type === "calendar") {
    return [item.category, item.date_gregorian, item.tithi].filter(Boolean);
  }
  return [item.category, item.tags, item.author].filter(Boolean);
}

function buildUrl(type, item) {
  const slug = encodeURIComponent(item.slug || item.id || "");
  if (type === "resources") {
    return item.official_url || "/resources.html";
  }
  if (type === "news") {
    return item.source_url || item.canonical_url || "/news.html";
  }
  if (type === "audio") {
    return `/audio-detail.html?slug=${slug}`;
  }
  if (type === "temples") {
    return `/temple-detail.html?slug=${slug}`;
  }
  if (type === "education") {
    return `/course-detail.html?slug=${slug}`;
  }
  if (type === "calendar") {
    return "/calendar.html";
  }
  if (type === "blogs") {
    return `/article.html?slug=${slug}`;
  }
  return `/article.html?type=${encodeURIComponent(type)}&slug=${slug}`;
}

function typeMap(type) {
  const value = normalizeString(type).toLowerCase();
  if (value === "courses") {
    return "education";
  }
  return value || "blogs";
}

function boostRecent(dateValue, amount) {
  const date = new Date(dateValue || "");
  if (Number.isNaN(date.getTime())) {
    return 0;
  }

  const daysOld = Math.floor((Date.now() - date.getTime()) / (1000 * 60 * 60 * 24));
  if (daysOld <= 7) {
    return amount;
  }
  if (daysOld <= 30) {
    return Math.floor(amount / 2);
  }
  return 0;
}
