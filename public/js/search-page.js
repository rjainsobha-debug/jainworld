import { searchAll } from "./api.js";

const SEARCH_TYPES = [
  "all",
  "literature",
  "education",
  "temples",
  "food",
  "news",
  "blogs",
  "audio",
  "resources",
  "calendar"
];

const POPULAR_SEARCHES = [
  "Ahimsa",
  "Paryushan",
  "Jain food rules",
  "Palitana temple",
  "Namokar Mantra",
  "Jain scholarships",
  "Minority resources",
  "Bhaktamar",
  "Samvatsari",
  "Dharamshala"
];

document.addEventListener("DOMContentLoaded", async () => {
  if (document.body.dataset.page !== "search") {
    return;
  }

  const form = document.getElementById("search-page-form");
  const input = document.getElementById("search-page-input");
  const typeSelect = document.getElementById("search-page-type");
  const params = new URLSearchParams(window.location.search);
  const query = params.get("q") || "";
  const type = normalizeType(params.get("type"));

  if (input) {
    input.value = query;
  }

  if (typeSelect) {
    typeSelect.value = type;
  }

  renderPopularSearches();
  bindTypeButtons();

  if (query) {
    await runSearch(query, type);
  } else {
    renderIntroState();
  }

  form?.addEventListener("submit", async (event) => {
    event.preventDefault();
    const nextQuery = input?.value?.trim() || "";
    const nextType = normalizeType(typeSelect?.value || "all");
    updateUrl(nextQuery, nextType);
    await runSearch(nextQuery, nextType);
  });
});

async function runSearch(query, type) {
  const resultsRoot = document.getElementById("search-results");
  const summaryRoot = document.getElementById("search-summary");
  const noResultsRoot = document.getElementById("search-no-results");
  const popularRoot = document.getElementById("popular-searches");

  if (!resultsRoot || !summaryRoot || !noResultsRoot || !popularRoot) {
    return;
  }

  if (!query) {
    renderIntroState();
    return;
  }

  resultsRoot.innerHTML = `<div class="jw-card p-5"><p class="m-0 text-sm text-stone-600">Searching JainWorld...</p></div>`;
  const startedAt = performance.now();

  let results = [];
  let modeLabel = "Sample fallback";

  try {
    results = await searchAll(query, {
      type: type === "all" ? "" : type,
      limit: 50
    });
    modeLabel = "Live or fallback search";
  } catch (error) {
    results = [];
  }

  const searchTime = Math.max(1, Math.round(performance.now() - startedAt));
  renderResults(resultsRoot, results, query);
  summaryRoot.innerHTML = `
    <div class="jw-card p-5">
      <div class="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 class="m-0 text-xl font-semibold text-stone-900">Search results</h2>
          <p class="m-0 mt-2 text-sm text-stone-600">${results.length} result(s) for "${escapeHtml(query)}" in ${searchTime} ms</p>
        </div>
        <span class="jw-badge jw-badge--approved">${escapeHtml(modeLabel)}</span>
      </div>
    </div>
  `;

  if (!results.length) {
    noResultsRoot.innerHTML = `
      <div class="jw-card p-5">
        <h3 class="m-0 text-lg font-semibold text-stone-900">No results found</h3>
        <p class="m-0 mt-2 text-sm leading-7 text-stone-600">Try a shorter search, switch content type, or start with one of the popular searches below.</p>
        <div class="mt-4 flex flex-wrap gap-2">
          ${POPULAR_SEARCHES.slice(0, 5)
            .map(
              (item) =>
                `<a class="jw-badge hover:border-stone-400" href="/search.html?q=${encodeURIComponent(item)}">${escapeHtml(item)}</a>`
            )
            .join("")}
        </div>
      </div>
    `;
  } else {
    noResultsRoot.innerHTML = "";
  }

  popularRoot.setAttribute("hidden", query ? "hidden" : "");
}

function renderResults(root, results, query) {
  if (!Array.isArray(results) || results.length === 0) {
    root.innerHTML = "";
    return;
  }

  root.innerHTML = `
    <div class="jw-list">
      ${results
        .map((item) => {
          const title = highlightMatch(item.title || "Untitled", query);
          const summary = highlightMatch(item.summary || "No summary available.", query);
          const meta = Array.isArray(item.meta) ? item.meta.filter(Boolean) : [];
          const source = item.source_name ? `<span>Source: ${escapeHtml(item.source_name)}</span>` : "";
          const review = item.review_status ? `<span>Status: ${escapeHtml(item.review_status)}</span>` : "";

          return `
            <article class="jw-card p-5">
              <div class="flex flex-wrap items-center gap-2">
                <span class="jw-badge">${escapeHtml(formatType(item.type))}</span>
                ${item.review_status ? `<span class="jw-badge jw-badge--approved">${escapeHtml(item.review_status)}</span>` : ""}
              </div>
              <h3 class="mt-3 text-lg font-semibold text-stone-900">
                <a href="${escapeHtml(item.url || "/search.html")}" class="hover:text-amber-800">${title}</a>
              </h3>
              <p class="m-0 mt-2 text-sm leading-7 text-stone-600">${summary}</p>
              <div class="jw-meta mt-3">
                ${meta.map((entry) => `<span>${escapeHtml(entry)}</span>`).join("")}
                ${source}
                ${review}
              </div>
            </article>
          `;
        })
        .join("")}
    </div>
  `;
}

function renderPopularSearches() {
  const root = document.getElementById("popular-searches");
  if (!root) {
    return;
  }

  root.innerHTML = `
    <div class="jw-card p-5">
      <h2 class="m-0 text-xl font-semibold text-stone-900">Popular searches</h2>
      <div class="mt-4 flex flex-wrap gap-2">
        ${POPULAR_SEARCHES.map(
          (item) =>
            `<a class="jw-badge hover:border-stone-400" href="/search.html?q=${encodeURIComponent(item)}">${escapeHtml(item)}</a>`
        ).join("")}
      </div>
    </div>
  `;
}

function renderIntroState() {
  const resultsRoot = document.getElementById("search-results");
  const summaryRoot = document.getElementById("search-summary");
  const noResultsRoot = document.getElementById("search-no-results");
  const popularRoot = document.getElementById("popular-searches");
  if (resultsRoot) {
    resultsRoot.innerHTML = "";
  }
  if (summaryRoot) {
    summaryRoot.innerHTML = `
      <div class="jw-card p-5">
        <h2 class="m-0 text-xl font-semibold text-stone-900">Start with a topic, place, festival, text, or resource</h2>
        <p class="m-0 mt-2 text-sm text-stone-600">Search across Jain literature, temples, audio, food guidance, news, scholarships, and learning paths.</p>
      </div>
    `;
  }
  if (noResultsRoot) {
    noResultsRoot.innerHTML = "";
  }
  if (popularRoot) {
    popularRoot.removeAttribute("hidden");
  }
}

function bindTypeButtons() {
  const buttons = document.querySelectorAll("[data-search-type-link]");
  const typeSelect = document.getElementById("search-page-type");
  const input = document.getElementById("search-page-input");

  buttons.forEach((button) => {
    button.addEventListener("click", async () => {
      const type = normalizeType(button.getAttribute("data-search-type-link"));
      if (typeSelect) {
        typeSelect.value = type;
      }
      const query = input?.value?.trim() || new URLSearchParams(window.location.search).get("q") || "";
      updateUrl(query, type);
      if (query) {
        await runSearch(query, type);
      }
    });
  });
}

function updateUrl(query, type) {
  const url = new URL(window.location.href);
  if (query) {
    url.searchParams.set("q", query);
  } else {
    url.searchParams.delete("q");
  }
  if (type && type !== "all") {
    url.searchParams.set("type", type);
  } else {
    url.searchParams.delete("type");
  }
  window.history.replaceState({}, "", url);
}

function normalizeType(type) {
  const value = String(type || "all").toLowerCase();
  return SEARCH_TYPES.includes(value) ? value : "all";
}

function formatType(type) {
  return String(type || "result")
    .replace(/-/g, " ")
    .replace(/\b\w/g, (character) => character.toUpperCase());
}

function highlightMatch(text, query) {
  const safeText = escapeHtml(text);
  const trimmedQuery = String(query || "").trim();
  if (!trimmedQuery) {
    return safeText;
  }

  const escapedQuery = trimmedQuery.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return safeText.replace(new RegExp(`(${escapedQuery})`, "ig"), "<mark>$1</mark>");
}

function escapeHtml(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}
