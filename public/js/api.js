import { API_BASE } from "./config.js";

export { API_BASE };

console.log("API loaded");

const LOCAL_FILES = {
  blogs: "/data/sample-blogs.json",
  literature: "/data/sample-literature.json",
  temples: "/data/sample-temples.json",
  food: "/data/sample-food.json",
  education: "/data/sample-education.json",
  calendar: "/data/sample-calendar.json",
  audio: "/data/sample-audio.json",
  news: "/data/sample-news.json",
  resources: "/data/sample-resources.json"
};

async function fetchJson(path, params = {}) {
  const url = new URL(path, API_BASE);

  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== "") {
      url.searchParams.set(key, value);
    }
  });

  const response = await fetch(url.toString());
  if (!response.ok) {
    throw new Error(`API request failed for ${path}`);
  }

  return response.json();
}

async function fetchSameOriginJson(path, options = {}) {
  const response = await fetch(path, options);
  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(data.error || `Request failed for ${path}`);
  }

  return data;
}

async function readLocalCollection(key) {
  const file = LOCAL_FILES[key];
  if (!file) {
    return [];
  }

  const response = await fetch(file);
  if (!response.ok) {
    return [];
  }

  return response.json();
}

function shouldUseLocalFallback() {
  return !API_BASE;
}

function normalizeCollection(data) {
  if (Array.isArray(data)) {
    return data;
  }

  if (Array.isArray(data?.results)) {
    return data.results;
  }

  if (Array.isArray(data?.items)) {
    return data.items;
  }

  return [];
}

function normalizeDetail(data) {
  if (!data || data.ok === false) {
    return null;
  }

  if (data.item && typeof data.item === "object") {
    return data.item;
  }

  return typeof data === "object" ? data : null;
}

function applyFilters(items, params = {}) {
  let results = [...items];

  if (params.category) {
    results = results.filter((item) =>
      String(item.category || "").toLowerCase() === String(params.category).toLowerCase()
    );
  }

  if (params.city) {
    results = results.filter((item) =>
      String(item.city || "").toLowerCase() === String(params.city).toLowerCase()
    );
  }

  if (params.country) {
    results = results.filter((item) =>
      String(item.country || "").toLowerCase() === String(params.country).toLowerCase()
    );
  }

  if (params.state) {
    results = results.filter((item) =>
      String(item.state || "").toLowerCase() === String(params.state).toLowerCase()
    );
  }

  if (params.level) {
    results = results.filter((item) =>
      String(item.course_level || item.difficulty || "").toLowerCase() ===
      String(params.level).toLowerCase()
    );
  }

  if (params.language) {
    results = results.filter((item) =>
      String(item.language || "").toLowerCase() === String(params.language).toLowerCase()
    );
  }

  if (params.review_status) {
    results = results.filter((item) =>
      String(item.review_status || "").toLowerCase() === String(params.review_status).toLowerCase()
    );
  }

  const query = String(params.search || params.q || "").toLowerCase().trim();
  if (query) {
    results = results.filter((item) => JSON.stringify(item).toLowerCase().includes(query));
  }

  const publishedOnly = params.includeDrafts !== true;
  if (publishedOnly) {
    results = results.filter((item) => {
      const status = String(item.status || "published").toLowerCase();
      return status === "published" || status === "active";
    });
  }

  const limit = Number(params.limit || results.length);
  return results.slice(0, Number.isFinite(limit) ? limit : results.length);
}

function sortByNewest(items, dateKeys = ["published_at", "updated_at", "created_at"]) {
  return [...items].sort((left, right) => {
    const leftValue = getNewestValue(left, dateKeys);
    const rightValue = getNewestValue(right, dateKeys);
    return rightValue.localeCompare(leftValue);
  });
}

function getNewestValue(item, dateKeys) {
  for (const key of dateKeys) {
    const value = String(item?.[key] || "").trim();
    if (value) {
      return value;
    }
  }

  return "";
}

function dedupeNews(items) {
  const seen = new Set();

  return items.filter((item) => {
    const key = String(
      item.duplicate_group_id || item.canonical_url || item.content_hash || item.slug || item.id || item.title_en || ""
    ).toLowerCase();

    if (!key) {
      return true;
    }

    if (seen.has(key)) {
      return false;
    }

    seen.add(key);
    return true;
  });
}

function applyClientLimit(items, limit) {
  const parsedLimit = Number(limit);
  if (!Number.isFinite(parsedLimit) || parsedLimit <= 0) {
    return items;
  }

  return items.slice(0, parsedLimit);
}

async function requestCollection(path, fallbackKey, params = {}) {
  if (!shouldUseLocalFallback()) {
    try {
      return normalizeCollection(await fetchJson(path, params));
    } catch (error) {
      console.warn("Using local fallback for", path, error);
    }
  }

  return applyFilters(await readLocalCollection(fallbackKey), params);
}

async function requestDetail(path, fallbackKey, slug) {
  if (!shouldUseLocalFallback()) {
    try {
      return normalizeDetail(await fetchJson(path));
    } catch (error) {
      console.warn("Using local detail fallback for", path, error);
    }
  }

  const items = await readLocalCollection(fallbackKey);
  return items.find((item) => item.slug === slug || item.id === slug) || null;
}

export function getBlogs(params = {}) {
  const requestedLimit = Number(params.limit || 0);
  const apiParams = {
    ...params,
    limit: 100
  };

  return requestCollection("/api/blogs", "blogs", apiParams).then((items) => {
    const sorted = sortByNewest(items, ["updated_at", "created_at"]);
    return applyClientLimit(sorted, requestedLimit || items.length);
  });
}

export function getBlog(slug) {
  return requestDetail(`/api/blogs/${encodeURIComponent(slug)}`, "blogs", slug);
}

export function getLiterature(params = {}) {
  return requestCollection("/api/literature", "literature", params);
}

export function getLiteratureItem(slug) {
  return requestDetail(`/api/literature/${encodeURIComponent(slug)}`, "literature", slug);
}

export function getTemples(params = {}) {
  return requestCollection("/api/temples", "temples", params);
}

export function getTemple(slug) {
  return requestDetail(`/api/temples/${encodeURIComponent(slug)}`, "temples", slug);
}

export function getFood(params = {}) {
  return requestCollection("/api/food", "food", params);
}

export function getFoodItem(slug) {
  return requestDetail(`/api/food/${encodeURIComponent(slug)}`, "food", slug);
}

export function getCourses(params = {}) {
  return requestCollection("/api/courses", "education", params);
}

export function getCourse(slug) {
  return requestDetail(`/api/courses/${encodeURIComponent(slug)}`, "education", slug);
}

export function getCalendar(params = {}) {
  return requestCollection("/api/calendar", "calendar", params);
}

export function getAudioItems(params = {}) {
  return requestCollection("/api/audio", "audio", params);
}

export async function getNews(params = {}) {
  if (!shouldUseLocalFallback()) {
    try {
      return sortByNewest(dedupeNews(normalizeCollection(await fetchJson("/api/news", params))));
    } catch (error) {
      console.warn("Using local news fallback", error);
    }
  }

  return sortByNewest(dedupeNews(applyFilters(await readLocalCollection("news"), params)));
}

export async function getCommunity(params = {}) {
  if (!shouldUseLocalFallback()) {
    try {
      return normalizeCollection(await fetchJson("/api/community", params));
    } catch (error) {
      console.warn("Using local community fallback", error);
    }
  }

  return [];
}

export async function getResources(params = {}) {
  // TODO: Switch this to /api/resources when the backend endpoint is available.
  return applyFilters(await readLocalCollection("resources"), params);
}

export async function searchAll(query, params = {}) {
  const lowerQuery = String(query || "").toLowerCase().trim();
  if (!lowerQuery) {
    return [];
  }

  let apiResults = [];

  if (!shouldUseLocalFallback()) {
    try {
      const data = await fetchSameOriginJson(`/api/search?${new URLSearchParams({ q: query, ...params }).toString()}`);
      apiResults = normalizeCollection(data);
    } catch (error) {
      console.warn("Using local search fallback", error);
    }
  }

  const [blogs, audio, literature, temples, food, education, news, resources, calendar] = await Promise.all([
    readLocalCollection("blogs"),
    readLocalCollection("audio"),
    readLocalCollection("literature"),
    readLocalCollection("temples"),
    readLocalCollection("food"),
    readLocalCollection("education"),
    readLocalCollection("news"),
    readLocalCollection("resources"),
    readLocalCollection("calendar")
  ]);

  const localCollections = [
    { type: "blogs", items: blogs },
    { type: "audio", items: audio },
    { type: "literature", items: literature },
    { type: "temples", items: temples },
    { type: "food", items: food },
    { type: "education", items: education },
    { type: "news", items: news },
    { type: "resources", items: resources },
    { type: "calendar", items: calendar }
  ];

  const filteredCollections =
    params.type && params.type !== "all"
      ? localCollections.filter(({ type }) => type === params.type)
      : localCollections;

  const localResults = filteredCollections.flatMap(({ type, items }) =>
    items
      .filter((item) => JSON.stringify(item).toLowerCase().includes(lowerQuery))
      .slice(0, 10)
      .map((item) => mapLocalSearchResult(type, item))
  );

  const seen = new Set();
  const merged = [...apiResults, ...localResults].filter((item) => {
    const key = `${item.type || "item"}::${item.slug || item.id || item.title || item.name}`;
    if (seen.has(key)) {
      return false;
    }

    seen.add(key);
    return true;
  });

  return applyClientLimit(merged, Number(params.limit || 50));
}

function mapLocalSearchResult(type, item) {
  const slug = item.slug || item.id || "";
  const title =
    item.title_en ||
    item.title ||
    item.name_en ||
    item.name ||
    item.course_title_en ||
    item.lesson_title_en ||
    item.festival_en ||
    "Untitled";
  const summary =
    item.summary_en ||
    item.summary ||
    item.description_en ||
    item.content_en ||
    item.history_en ||
    item.meaning_en ||
    item.description ||
    "";

  return {
    id: item.id || slug,
    type,
    title,
    summary,
    url: buildSearchResultUrl(type, slug, item),
    meta: buildSearchMeta(type, item),
    review_status: item.review_status || item.verified_status || "",
    source_name: item.source_name || item.source || "",
    score: 0
  };
}

function buildSearchResultUrl(type, slug, item) {
  const encodedSlug = encodeURIComponent(slug || "");
  if (type === "blogs") {
    return `/article.html?type=blogs&slug=${encodedSlug}`;
  }
  if (type === "audio") {
    return `/audio-detail.html?slug=${encodedSlug}`;
  }
  if (type === "temples") {
    return `/temple-detail.html?slug=${encodedSlug}`;
  }
  if (type === "education") {
    return `/course-detail.html?slug=${encodedSlug}`;
  }
  if (type === "resources") {
    return "/resources.html";
  }
  if (type === "news") {
    return "/news.html";
  }
  if (type === "calendar") {
    return "/calendar.html";
  }
  return `/article.html?type=${encodeURIComponent(type)}&slug=${encodedSlug}`;
}

function buildSearchMeta(type, item) {
  if (type === "temples") {
    return [item.city, item.state, item.country].filter(Boolean);
  }
  if (type === "education") {
    return [item.course_level, item.topic, item.difficulty].filter(Boolean);
  }
  if (type === "resources") {
    return [item.category, item.state, item.last_verified_at].filter(Boolean);
  }
  if (type === "audio") {
    return [item.category, item.language, item.duration].filter(Boolean);
  }
  if (type === "calendar") {
    return [item.category, item.date_gregorian, item.tithi].filter(Boolean);
  }
  return [item.category, item.tags, item.author].filter(Boolean);
}

export async function submitCommunity(payload) {
  try {
    const sameOriginResponse = await fetchSameOriginJson("/api/community-submit", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(payload)
    });

    return sameOriginResponse;
  } catch (error) {
    console.warn("Same-origin community submit unavailable, falling back", error);
  }

  if (!shouldUseLocalFallback()) {
    try {
      const response = await fetch(new URL("/api/community", API_BASE).toString(), {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(payload)
      });
      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        return {
          success: false,
          error: data.error || "Community submit failed"
        };
      }

      return data;
    } catch (error) {
      console.warn("Using local community submit fallback", error);
    }
  }

  return {
    ok: false,
    success: false,
    error: "We could not submit right now. Please try again later."
  };
}

export async function submitCorrection(payload) {
  // TODO: Add a public corrections form that can safely POST to /api/correction-submit.
  try {
    return await fetchSameOriginJson("/api/correction-submit", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(payload)
    });
  } catch (error) {
    return {
      success: false,
      error: error.message || "Correction submit failed"
    };
  }
}
