import { createId, normalizeString, nowIso, safeLimit } from "./http.js";

const PUBLIC_STATUS = new Set(["published", "active"]);
const PUBLIC_REVIEW_STATUS = new Set(["approved", "verified", "published", ""]);
const ALLOWED_TYPES = new Set([
  "all",
  "literature",
  "education",
  "temples",
  "food",
  "news",
  "blogs",
  "audio",
  "resources",
  "calendar",
  "directory",
  "speakers",
  "names",
  "dictionary",
  "books"
]);

const STOP_WORDS = new Set([
  "what",
  "why",
  "how",
  "are",
  "is",
  "do",
  "does",
  "needed",
  "need",
  "for",
  "the",
  "a",
  "an",
  "of",
  "in",
  "on",
  "to",
  "with",
  "from",
  "please",
  "find",
  "explain",
  "tell",
  "me",
  "क्या",
  "क्यों",
  "कैसे",
  "कौन",
  "है",
  "हैं",
  "था",
  "थी",
  "थे",
  "का",
  "की",
  "के",
  "को",
  "से",
  "में",
  "पर",
  "और",
  "या",
  "यह",
  "वह"
]);

const STEM_MAP = new Map([
  ["scholarships", "scholarship"],
  ["documents", "document"],
  ["temples", "temple"],
  ["rules", "rule"],
  ["sources", "source"],
  ["applications", "application"],
  ["certificates", "certificate"],
  ["papers", "paper"]
]);

const HINDI_TOKEN_MAP = new Map([
  ["सामायिक", "samayik"],
  ["अनेकांतवाद", "anekantavada"],
  ["अहिंसा", "ahimsa"],
  ["अपरिग्रह", "aparigraha"],
  ["नमोकार", "namokar"],
  ["नवकार", "navkar"],
  ["पर्युषण", "paryushan"],
  ["संवत्सरी", "samvatsari"],
  ["प्रतिक्रमण", "pratikraman"],
  ["तीर्थंकर", "tirthankar"],
  ["मोक्ष", "moksha"],
  ["कर्म", "karma"],
  ["भजन", "bhajan"],
  ["आरती", "aarti"],
  ["मंदिर", "temple"],
  ["तीर्थ", "tirth"],
  ["भोजन", "food"],
  ["छात्रवृत्ति", "scholarship"],
  ["दस्तावेज़", "document"],
  ["दस्तावेज", "document"],
  ["कागज़ात", "document"]
]);

const TOKEN_SYNONYMS = {
  scholarship: ["scholarships", "student aid", "education support"],
  document: ["documents", "papers", "certificate", "certificates"],
  minority: ["minority resources", "government scheme"],
  namokar: ["navkar", "namokar mantra", "navkar mantra"],
  temple: ["mandir", "tirth", "pilgrimage"],
  food: ["diet", "eating", "ingredients"],
  ahimsa: ["non violence", "non-violence"],
  books: ["book", "books", "literature", "reading list", "पुस्तकें"],
  dictionary: ["dictionary", "terms", "glossary", "शब्दकोश"],
  names: ["names", "baby names", "jain names", "नाम"],
  speakers: ["speakers", "scholars", "lectures", "प्रवचन", "वक्ता"],
  directory: ["directory", "resources", "sections", "निर्देशिका"]
};

const TYPE_INTENT_MAP = {
  books: new Set(["book", "books", "literature", "reading", "list", "पुस्तकें"]),
  dictionary: new Set(["dictionary", "term", "terms", "glossary", "शब्दकोश"]),
  names: new Set(["name", "names", "baby", "jain", "नाम"]),
  speakers: new Set(["speaker", "speakers", "scholar", "scholars", "lecture", "lectures", "प्रवचन", "वक्ता"]),
  directory: new Set(["directory", "directories", "resource", "resources", "section", "sections", "निर्देशिका"])
};

export function normalizeQuery(text) {
  return normalizeString(text)
    .toLowerCase()
    .replace(/[^\p{L}\p{M}\p{N}\s-]/gu, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function normalizeToken(token) {
  const normalized = normalizeQuery(token);
  if (!normalized) {
    return "";
  }

  if (HINDI_TOKEN_MAP.has(normalized)) {
    return HINDI_TOKEN_MAP.get(normalized) || "";
  }

  return STEM_MAP.get(normalized) || normalized;
}

export function tokenizeQuery(text) {
  const rawTokens = normalizeQuery(text)
    .split(" ")
    .map((token) => token.trim())
    .filter((token) => token && !STOP_WORDS.has(token));

  const expanded = new Set();
  rawTokens.forEach((token) => {
    expanded.add(token);

    const normalizedToken = normalizeToken(token);
    if (normalizedToken && !STOP_WORDS.has(normalizedToken)) {
      expanded.add(normalizedToken);
    }

    [token, normalizedToken].filter(Boolean).forEach((entry) => {
      (TOKEN_SYNONYMS[entry] || []).forEach((synonym) => {
        normalizeQuery(synonym)
          .split(" ")
          .map((value) => normalizeToken(value) || normalizeQuery(value))
          .filter((value) => value && !STOP_WORDS.has(value))
          .forEach((value) => expanded.add(value));
      });
    });
  });

  rawTokens.forEach((token) => {
    const mapped = normalizeToken(token);
    [token, mapped].filter(Boolean).forEach((entry) => {
      (TOKEN_SYNONYMS[entry] || []).forEach((synonym) => {
      normalizeQuery(synonym)
        .split(" ")
        .map((value) => normalizeToken(value) || normalizeQuery(value))
        .filter((value) => value && !STOP_WORDS.has(value))
        .forEach((value) => expanded.add(value));
      });
    });
  });

  return [...expanded];
}

export function tokenize(text) {
  return tokenizeQuery(text);
}

export function expandQueryVariants(text) {
  const base = normalizeQuery(text);
  const tokens = tokenizeQuery(text);
  return {
    normalized: base,
    tokens,
    phrases: [base, ...tokens].filter(Boolean)
  };
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
  const tokens = tokenizeQuery(query);
  const title = normalizeQuery(item.title || "");
  const summary = normalizeQuery(item.summary || "");
  const body = normalizeQuery(item.body || "");
  const category = normalizeQuery((item.meta || []).join(" "));
  const tags = normalizeQuery(item.tags || "");
  const sourceName = normalizeQuery(item.source_name || "");
  let score = 0;

  if (!normalizedQuery && !tokens.length) {
    return score;
  }

  if (normalizedQuery && title === normalizedQuery) {
    score += 140;
  }

  if (normalizedQuery && title.startsWith(normalizedQuery)) {
    score += 95;
  }

  if (normalizedQuery && title.includes(normalizedQuery)) {
    score += 80;
  }

  if (normalizedQuery && (category.includes(normalizedQuery) || tags.includes(normalizedQuery))) {
    score += 45;
  }

  if (normalizedQuery && summary.includes(normalizedQuery)) {
    score += 28;
  }

  if (normalizedQuery && body.includes(normalizedQuery)) {
    score += 16;
  }

  let matchedTokens = 0;
  tokens.forEach((token) => {
    let matched = false;
    if (title.includes(token)) {
      score += 24;
      matched = true;
    }
    if (summary.includes(token)) {
      score += 12;
      matched = true;
    }
    if (body.includes(token)) {
      score += 10;
      matched = true;
    }
    if (category.includes(token) || tags.includes(token) || sourceName.includes(token)) {
      score += 14;
      matched = true;
    }
    if (matched) {
      matchedTokens += 1;
    }
  });

  if (tokens.length && matchedTokens === tokens.length) {
    score += 40;
  } else if (matchedTokens > 0) {
    score += matchedTokens * 4;
  }

  score += Number(item.search_weight || 0) * 10;

  if (item.type === "news") {
    score += boostRecent(item.updated_at || item.created_at || item.published_at, 20);
  }

  if (item.type === "resources" && normalizeString(item.review_status).toLowerCase() === "verified") {
    score += 18;
  }

  if (item.type === "audio" && (category.includes(normalizedQuery) || tags.includes(normalizedQuery))) {
    score += 14;
  }

  if (item.type === "temples") {
    const location = normalizeQuery((item.meta || []).join(" "));
    if (location.includes(normalizedQuery)) {
      score += 18;
    }
  }

  score += getTypeIntentBoost(item.type, normalizedQuery, tokens);

  return score;
}

export function makeSnippet(text, query) {
  const source = normalizeString(text);
  if (!source) {
    return "";
  }

  const lowered = source.toLowerCase();
  const variants = expandQueryVariants(query);
  const anchors = [variants.normalized, ...variants.tokens].filter(Boolean);
  if (!anchors.length) {
    return source.slice(0, 180);
  }

  let index = -1;
  let matchLength = 0;
  for (const anchor of anchors) {
    const nextIndex = lowered.indexOf(anchor);
    if (nextIndex !== -1) {
      index = nextIndex;
      matchLength = anchor.length;
      break;
    }
  }

  if (index === -1) {
    return source.slice(0, 180);
  }

  const start = Math.max(0, index - 60);
  const end = Math.min(source.length, index + matchLength + 120);
  const snippet = source.slice(start, end).trim();
  return `${start > 0 ? "..." : ""}${snippet}${end < source.length ? "..." : ""}`;
}

export function buildResult(type, item, query) {
  const mappedType = typeMap(type || item.content_type);
  const title =
    normalizeString(item.title) ||
    normalizeString(item.title_en) ||
    normalizeString(item.name_en) ||
    normalizeString(item.course_title_en) ||
    normalizeString(item.lesson_title_en) ||
    normalizeString(item.festival_en) ||
    "Untitled";
  const rawSummary =
    normalizeString(item.summary) ||
    normalizeString(item.summary_en) ||
    normalizeString(item.description_en) ||
    normalizeString(item.content_en) ||
    normalizeString(item.history_en) ||
    normalizeString(item.meaning_en) ||
    normalizeString(item.description) ||
    "";
  const body =
    normalizeString(item.body) ||
    normalizeString(item.content_en) ||
    normalizeString(item.history_en) ||
    normalizeString(item.ingredients_en) ||
    normalizeString(item.method_en) ||
    rawSummary;
  const meta = buildMeta(mappedType, item);
  const result = {
    id: item.id || item.slug || createId("search-item"),
    type: mappedType,
    title,
    summary: makeSnippet(rawSummary || body || title, query),
    body,
    url: buildUrl(mappedType, item),
    meta,
    score: 0,
    search_weight: Number(item.search_weight || 0),
    review_status: normalizeString(item.review_status),
    source_name: normalizeString(item.source_name || item.source || item.author),
    tags: normalizeString(item.tags),
    created_at: normalizeString(item.created_at),
    updated_at: normalizeString(item.updated_at || item.published_at)
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
  return ALLOWED_TYPES.has(value) ? value : "all";
}

export function indexTypeToPublicType(contentType) {
  const mapped = typeMap(contentType);
  return mapped === "courses" ? "education" : mapped;
}

function buildMeta(type, item) {
  if (type === "resources") {
    return [item.category, item.state, item.last_verified_at ? `Verified: ${item.last_verified_at}` : ""].filter(Boolean);
  }
  if (type === "news") {
    return [item.category, item.region, item.published_at || item.created_at, item.source_name ? "Curated" : ""].filter(Boolean);
  }
  if (type === "audio") {
    return [item.category, item.language, item.duration].filter(Boolean);
  }
  if (type === "temples") {
    return [item.city, item.state, item.country, item.category].filter(Boolean);
  }
  if (type === "education") {
    return [item.course_level, item.topic, item.difficulty].filter(Boolean);
  }
  if (type === "calendar") {
    return [item.category, item.date_gregorian, item.tithi].filter(Boolean);
  }
  if (type === "directory") {
    return [item.category, item.priority, item.review_status].filter(Boolean);
  }
  if (type === "speakers") {
    return [item.tradition_or_context, item.topics, item.review_status].filter(Boolean);
  }
  if (type === "names") {
    return [item.gender, item.meaning, item.review_status].filter(Boolean);
  }
  if (type === "dictionary") {
    return [item.category, item.review_status].filter(Boolean);
  }
  if (type === "books") {
    return [item.author, item.category, item.publication_status, item.review_status].filter(Boolean);
  }
  return [item.category, item.tags, item.author].filter(Boolean);
}

function buildUrl(type, item) {
  const slug = encodeURIComponent(item.slug || item.source_id || item.id || "");
  if (type === "resources") {
    return "/resources.html";
  }
  if (type === "news") {
    return "/news.html";
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
  if (type === "directory") {
    return item.url || "/directory.html";
  }
  if (type === "speakers") {
    return "/speakers.html";
  }
  if (type === "names") {
    return "/names.html";
  }
  if (type === "dictionary") {
    return "/dictionary.html";
  }
  if (type === "books") {
    return "/books.html";
  }
  if (type === "blogs") {
    return `/article.html?type=blogs&slug=${slug}`;
  }
  if (type === "literature") {
    return `/article.html?type=literature&slug=${slug}`;
  }
  if (type === "food") {
    return `/article.html?type=food&slug=${slug}`;
  }
  return item.url || `/article.html?type=${encodeURIComponent(type)}&slug=${slug}`;
}

function typeMap(type) {
  const value = normalizeString(type).toLowerCase();
  if (value === "courses") {
    return "education";
  }
  return value || "blogs";
}

function getTypeIntentBoost(type, normalizedQuery, tokens) {
  const hints = TYPE_INTENT_MAP[type];
  if (!hints) {
    return 0;
  }

  let boost = 0;
  if (normalizedQuery && hints.has(normalizedQuery)) {
    boost += 90;
  }

  tokens.forEach((token) => {
    if (hints.has(token)) {
      boost += 24;
    }
  });

  return boost;
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
