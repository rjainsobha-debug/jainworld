import { searchAll } from "./api.js";
import { getLanguage, translate, updateLanguageDOM } from "./language.js";

const SEARCH_TYPES = ["all", "literature", "education", "temples", "food", "news", "blogs", "audio", "resources", "calendar"];

const TYPE_LABELS = {
  all: { en: "All", hi: "सभी" },
  literature: { en: "Literature", hi: "साहित्य" },
  education: { en: "Education", hi: "शिक्षा" },
  temples: { en: "Temples", hi: "मंदिर" },
  food: { en: "Food", hi: "भोजन" },
  news: { en: "News", hi: "समाचार" },
  blogs: { en: "Blogs", hi: "ब्लॉग" },
  audio: { en: "Audio", hi: "ऑडियो" },
  resources: { en: "Resources", hi: "संसाधन" },
  calendar: { en: "Calendar", hi: "कैलेंडर" }
};

const POPULAR_SEARCHES = [
  { en: "Ahimsa", hi: "अहिंसा" },
  { en: "Paryushan", hi: "पर्युषण" },
  { en: "Jain food rules", hi: "जैन भोजन नियम" },
  { en: "Palitana temple", hi: "पालिताना मंदिर" },
  { en: "Namokar Mantra", hi: "णमोकार मंत्र" },
  { en: "Jain scholarships", hi: "जैन छात्रवृत्ति" },
  { en: "Minority resources", hi: "अल्पसंख्यक संसाधन" },
  { en: "Bhaktamar", hi: "भक्तामर" },
  { en: "Samvatsari", hi: "संवत्सरी" },
  { en: "Dharamshala", hi: "धर्मशाला" }
];

const state = {
  query: "",
  type: "all",
  results: [],
  modeLabel: "",
  searchTime: 0
};

document.addEventListener("DOMContentLoaded", async () => {
  if (document.body.dataset.page !== "search") {
    return;
  }

  const form = document.getElementById("search-page-form");
  const input = document.getElementById("search-page-input");
  const typeSelect = document.getElementById("search-page-type");
  const params = new URLSearchParams(window.location.search);
  state.query = params.get("q") || "";
  state.type = normalizeType(params.get("type"));

  if (input) {
    input.value = state.query;
  }

  if (typeSelect) {
    typeSelect.value = state.type;
  }

  renderPopularSearches();
  bindTypeButtons();
  updateAskLink(state.query);

  if (state.query) {
    await runSearch(state.query, state.type);
  } else {
    renderIntroState();
  }

  form?.addEventListener("submit", async (event) => {
    event.preventDefault();
    const nextQuery = input?.value?.trim() || "";
    const nextType = normalizeType(typeSelect?.value || "all");
    updateUrl(nextQuery, nextType);
    updateAskLink(nextQuery);
    await runSearch(nextQuery, nextType);
  });

  window.addEventListener("jainworld:language-change", () => {
    renderPopularSearches();
    if (state.query) {
      renderCurrentState();
    } else {
      renderIntroState();
    }
  });
});

async function runSearch(query, type) {
  const resultsRoot = document.getElementById("search-results");
  if (!resultsRoot) {
    return;
  }

  state.query = query;
  state.type = type;

  if (!query) {
    renderIntroState();
    return;
  }

  resultsRoot.innerHTML = `<div class="jw-card p-5"><p class="m-0 text-sm text-stone-600">${escapeHtml(copy().loading)}</p></div>`;
  const startedAt = performance.now();

  let results = [];
  let modeLabel = copy().fallbackMode;

  try {
    results = await searchAll(query, {
      type: type === "all" ? "" : type,
      limit: 50
    });
    modeLabel = copy().searchMode;
  } catch (error) {
    results = [];
  }

  state.results = results;
  state.modeLabel = modeLabel;
  state.searchTime = Math.max(1, Math.round(performance.now() - startedAt));
  renderCurrentState();
}

function renderCurrentState() {
  const resultsRoot = document.getElementById("search-results");
  const summaryRoot = document.getElementById("search-summary");
  const noResultsRoot = document.getElementById("search-no-results");
  const popularRoot = document.getElementById("popular-searches");

  if (!resultsRoot || !summaryRoot || !noResultsRoot || !popularRoot) {
    return;
  }

  renderResults(resultsRoot, state.results, state.query, state.type);
  summaryRoot.innerHTML = `
    <div class="soft-card p-5">
      <div class="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 class="m-0 text-xl font-semibold text-stone-900">${translate("search_results", "Search results")}</h2>
          <p class="m-0 mt-2 text-sm text-stone-600">${escapeHtml(formatResultCount(state.results.length, state.query, state.searchTime))}</p>
        </div>
        <span class="jw-badge jw-badge--approved">${escapeHtml(state.modeLabel)}</span>
      </div>
    </div>
  `;

  if (!state.results.length) {
    noResultsRoot.innerHTML = `
      <div class="soft-card p-5">
        <h3 class="m-0 text-lg font-semibold text-stone-900">${translate("no_results", "No results found")}</h3>
        <p class="m-0 mt-2 text-sm leading-7 text-stone-600">${escapeHtml(copy().noResultsHelp)}</p>
        <div class="mt-4 flex flex-wrap gap-2">
          ${POPULAR_SEARCHES.slice(0, 5)
            .map(
              (item) =>
                `<a class="topic-chip" href="/search.html?q=${encodeURIComponent(item.en)}" data-en="${item.en}" data-hi="${item.hi}">${escapeHtml(item.en)}</a>`
            )
            .join("")}
        </div>
      </div>
    `;
  } else {
    noResultsRoot.innerHTML = "";
  }

  popularRoot.hidden = Boolean(state.query);
  updateLanguageDOM(getLanguage());
}

function renderResults(root, results, query, type) {
  if (!Array.isArray(results) || results.length === 0) {
    root.innerHTML = "";
    return;
  }

  if (type === "all") {
    const grouped = groupByType(results);
    root.innerHTML = Object.entries(grouped)
      .map(([groupType, groupItems]) => {
        if (!groupItems.length) {
          return "";
        }

        return `
          <section class="mb-6">
            <div class="mb-3 flex items-center justify-between gap-3">
              <h3 class="m-0 text-lg font-semibold text-stone-900">${escapeHtml(formatType(groupType))}</h3>
              <span class="jw-badge">${groupItems.length}</span>
            </div>
            <div class="jw-list">
              ${groupItems.map((item) => renderSearchCard(item, query)).join("")}
            </div>
          </section>
        `;
      })
      .join("");
    return;
  }

  root.innerHTML = `
    <div class="jw-list">
      ${results.map((item) => renderSearchCard(item, query)).join("")}
    </div>
  `;
}

function renderSearchCard(item, query) {
  const title = highlightMatch(item.title || "Untitled", query);
  const summary = highlightMatch(item.summary || copy().noSummary, query);
  const meta = Array.isArray(item.meta) ? item.meta.filter(Boolean) : [];
  const source = item.source_name
    ? `<span>${escapeHtml(currentLanguage() === "hi" ? `स्रोत: ${item.source_name}` : `Source: ${item.source_name}`)}</span>`
    : "";
  const reviewText = item.review_status ? formatReview(item.review_status) : "";

  return `
    <article class="jw-card p-5">
      <div class="flex flex-wrap items-center gap-2">
        <span class="jw-badge">${escapeHtml(formatType(item.type))}</span>
        ${item.review_status ? `<span class="jw-badge jw-badge--approved">${escapeHtml(reviewText)}</span>` : ""}
      </div>
      <h3 class="mt-3 text-lg font-semibold text-stone-900">
        <a href="${escapeHtml(item.url || "/search.html")}" class="hover:text-amber-800">${title}</a>
      </h3>
      <p class="m-0 mt-2 text-sm leading-7 text-stone-600">${summary}</p>
      <div class="jw-meta mt-3">
        ${meta.map((entry) => `<span>${escapeHtml(entry)}</span>`).join("")}
        ${source}
      </div>
      <div class="mt-4">
        <a href="${escapeHtml(item.url || "/search.html")}" class="text-sm font-semibold text-amber-800 hover:text-amber-900">${translate("view_result", "View result")}</a>
      </div>
    </article>
  `;
}

function renderPopularSearches() {
  const root = document.getElementById("popular-searches");
  if (!root) {
    return;
  }

  root.innerHTML = `
    <div class="soft-card p-5">
      <h2 class="m-0 text-xl font-semibold text-stone-900">${translate("popular_searches", "Popular searches")}</h2>
      <div class="mt-4 flex flex-wrap gap-2">
        ${POPULAR_SEARCHES.map(
          (item) =>
            `<a class="topic-chip" href="/search.html?q=${encodeURIComponent(item.en)}" data-en="${item.en}" data-hi="${item.hi}">${escapeHtml(item.en)}</a>`
        ).join("")}
      </div>
    </div>
  `;
  updateLanguageDOM(getLanguage());
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
      <div class="soft-card p-5">
        <h2 class="m-0 text-xl font-semibold text-stone-900">${escapeHtml(copy().introHeading)}</h2>
        <p class="m-0 mt-2 text-sm text-stone-600">${escapeHtml(copy().introText)}</p>
      </div>
    `;
  }
  if (noResultsRoot) {
    noResultsRoot.innerHTML = "";
  }
  if (popularRoot) {
    popularRoot.hidden = false;
  }

  updateAskLink("");
  updateLanguageDOM(getLanguage());
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
      updateAskLink(query);
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

function updateAskLink(query) {
  const link = document.getElementById("search-ask-link");
  if (!link) {
    return;
  }

  link.href = query ? `/ask.html?q=${encodeURIComponent(query)}` : "/ask.html";
}

function normalizeType(type) {
  const value = String(type || "all").toLowerCase();
  return SEARCH_TYPES.includes(value) ? value : "all";
}

function formatType(type) {
  const labels = TYPE_LABELS[String(type || "all").toLowerCase()];
  return labels ? labels[currentLanguage()] || labels.en : String(type || "result").replace(/-/g, " ").replace(/\b\w/g, (character) => character.toUpperCase());
}

function formatReview(value) {
  const normalized = String(value || "").toLowerCase();
  if (normalized === "verified") {
    return translate("verified", "Verified");
  }
  if (normalized === "approved" || normalized === "published") {
    return translate("curated", "Curated");
  }
  return String(value || "");
}

function groupByType(results) {
  return results.reduce((groups, item) => {
    const key = item.type || "results";
    if (!groups[key]) {
      groups[key] = [];
    }
    groups[key].push(item);
    return groups;
  }, {});
}

function formatResultCount(count, query, time) {
  if (currentLanguage() === "hi") {
    return `"${query}" के लिए ${count} परिणाम ${time} मि.से. में मिले`;
  }

  return `${count} result(s) for "${query}" in ${time} ms`;
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

function currentLanguage() {
  return getLanguage() === "hi" ? "hi" : "en";
}

function copy() {
  if (currentLanguage() === "hi") {
    return {
      loading: "JainWorld में खोज हो रही है...",
      fallbackMode: "नमूना बैकअप मोड",
      searchMode: "JainWorld खोज",
      noResultsHelp:
        "छोटी खोज, अलग सामग्री प्रकार, या पर्व, प्रार्थना, स्थान, भोजन नियम या छात्रवृत्ति जैसे विषय से शुरुआत करें।",
      introHeading: "किसी विषय, प्रार्थना, स्थान, पर्व या संसाधन से शुरुआत करें",
      introText: "जैन साहित्य, मंदिर, ऑडियो, भोजन मार्गदर्शन, समाचार, छात्रवृत्ति और सीखने के मार्गों में खोजें।",
      noSummary: "सारांश उपलब्ध नहीं है।"
    };
  }

  return {
    loading: "Searching JainWorld...",
    fallbackMode: "Sample fallback mode",
    searchMode: "JainWorld search",
    noResultsHelp:
      "Try a shorter search, switch content type, or begin with a festival, prayer, place, food rule, or scholarship topic.",
    introHeading: "Start with a topic, prayer, place, festival, or resource",
    introText: "Search across Jain literature, temples, audio, food guidance, news, scholarships, and learning paths.",
    noSummary: "No summary available."
  };
}

function escapeHtml(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}
