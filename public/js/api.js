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
  audio: "/data/sample-audio.json"
};

const SAMPLE_NEWS = [
  {
    id: "news-1",
    title: "Mahavir Jayanti preparation guide for temples and local communities",
    link: "https://jainworld.in/news/mahavir-jayanti-preparation-guide",
    source: "JainWorld Starter Feed",
    category: "Festival",
    summary: "Starter item showing how RSS summaries, categories, and dates will render on the frontend.",
    image: "",
    published_at: "2026-04-20",
    hash: "mahavir-jayanti-guide",
    status: "published"
  },
  {
    id: "news-2",
    title: "Pilgrimage planning checklist for Palitana and Girnar season",
    link: "https://jainworld.in/news/pilgrimage-planning-checklist",
    source: "JainWorld Starter Feed",
    category: "Pilgrimage",
    summary: "A sample travel-oriented update covering routes, food discipline, and family planning tips.",
    image: "",
    published_at: "2026-04-18",
    hash: "pilgrimage-planning-checklist",
    status: "published"
  },
  {
    id: "news-3",
    title: "Community education drive launches beginner Ahimsa study circle",
    link: "https://jainworld.in/news/ahimsa-study-circle",
    source: "JainWorld Starter Feed",
    category: "Education",
    summary: "This sample card represents filtered Jain education news from RSS or manual sources.",
    image: "",
    published_at: "2026-04-15",
    hash: "ahimsa-study-circle",
    status: "published"
  },
  {
    id: "news-4",
    title: "Temple volunteer teams expand boiled water and no-wastage awareness",
    link: "https://jainworld.in/news/temple-volunteer-awareness",
    source: "JainWorld Starter Feed",
    category: "Community",
    summary: "Sample operational update for temple or sangh announcements on food discipline and seva.",
    image: "",
    published_at: "2026-04-12",
    hash: "temple-volunteer-awareness",
    status: "published"
  }
];

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

async function readLocalCollection(key) {
  if (key === "news") {
    return SAMPLE_NEWS;
  }

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

  if (params.level) {
    results = results.filter((item) =>
      String(item.course_level || item.difficulty || "").toLowerCase() ===
      String(params.level).toLowerCase()
    );
  }

  const query = (params.search || params.q || "").toLowerCase().trim();
  if (query) {
    results = results.filter((item) => JSON.stringify(item).toLowerCase().includes(query));
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
      return sortByNewest(normalizeCollection(await fetchJson("/api/news", params)));
    } catch (error) {
      console.warn("Using local news fallback", error);
    }
  }

  return sortByNewest(applyFilters(SAMPLE_NEWS, params));
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

export async function searchAll(query, params = {}) {
  if (!shouldUseLocalFallback()) {
    try {
      const data = await fetchJson("/api/search", { q: query, ...params });
      return normalizeCollection(data);
    } catch (error) {
      console.warn("Using local search fallback", error);
    }
  }

  const collections = await Promise.all([
    readLocalCollection("blogs"),
    readLocalCollection("audio"),
    readLocalCollection("literature"),
    readLocalCollection("temples"),
    readLocalCollection("food"),
    readLocalCollection("education"),
    readLocalCollection("news")
  ]);

  const types = ["blogs", "audio", "literature", "temples", "food", "education", "news"];
  const lowerQuery = String(query || "").toLowerCase().trim();

  if (!lowerQuery) {
    return [];
  }

  return collections.flatMap((items, index) => {
    return items
      .filter((item) => JSON.stringify(item).toLowerCase().includes(lowerQuery))
      .slice(0, 10)
      .map((item) => ({ type: types[index], ...item }));
  });
}

export async function submitCommunity(payload) {
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
    success: true,
    verification_status: "pending",
    message: "Community request saved in starter mode. Connect Apps Script later for live writing."
  };
}
