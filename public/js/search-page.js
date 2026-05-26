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
  { en: "Namokar Mantra", hi: "नमोकार मंत्र" },
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
  searchTime: 0,
  modeLabel: ""
};

document.addEventListener("DOMContentLoaded", async () => {
  if (document.body.dataset.page !== "search") {
    return;
  }

  const params = new URLSearchParams(window.location.search);
  state.query = params.get("q") || "";
  state.type = normalizeType(params.get("type"));

  const input = document.getElementById("search-page-input");
  const select = document.getElementById("search-page-type");
  if (input) {
    input.value = state.query;
  }
  if (select) {
    select.value = state.type;
  }

  renderPopularSearches();
  bindForm();
  bindTypeButtons();
  updateAskLink(state.query);

  if (state.query) {
    await runSearch(state.query, state.type);
  } else {
    renderIntroState();
  }

  window.addEventListener("jainworld:language-change", () => {
    renderPopularSearches();
    state.query ? renderState() : renderIntroState();
  });
});

function bindForm() {
  const form = document.getElementById("search-page-form");
  const input = document.getElementById("search-page-input");
  const select = document.getElementById("search-page-type");

  form?.addEventListener("submit", async (event) => {
    event.preventDefault();
    const query = String(input?.value || "").trim();
    const type = normalizeType(select?.value);
    updateUrl(query, type);
    updateAskLink(query);
    await runSearch(query, type);
  });
}

function bindTypeButtons() {
  const buttons = document.querySelectorAll("[data-search-type-link]");
  const input = document.getElementById("search-page-input");
  const select = document.getElementById("search-page-type");

  buttons.forEach((button) => {
    button.addEventListener("click", async () => {
      const type = normalizeType(button.getAttribute("data-search-type-link"));
      if (select) {
        select.value = type;
      }
      const query = String(input?.value || state.query || "").trim();
      updateUrl(query, type);
      updateAskLink(query);
      if (query) {
        await runSearch(query, type);
      }
    });
  });
}

async function runSearch(query, type) {
  state.query = query;
  state.type = type;

  const resultsRoot = document.getElementById("search-results");
  if (!resultsRoot) {
    return;
  }

  if (!query) {
    renderIntroState();
    return;
  }

  resultsRoot.innerHTML = `<div class="jw-card p-5"><p class="m-0 text-sm text-stone-600">${escapeHtml(copy().loading)}</p></div>`;

  const startedAt = performance.now();

  try {
    state.results = await searchAll(query, { type: type === "all" ? "" : type, limit: 50 });
    state.modeLabel = copy().searchMode;
  } catch (error) {
    state.results = [];
    state.modeLabel = copy().fallbackMode;
  }

  state.searchTime = Math.max(1, Math.round(performance.now() - startedAt));
  renderState();
}

function renderState() {
  const summaryRoot = document.getElementById("search-summary");
  const resultsRoot = document.getElementById("search-results");
  const noResultsRoot = document.getElementById("search-no-results");
  const popularRoot = document.getElementById("popular-searches");

  if (!summaryRoot || !resultsRoot || !noResultsRoot || !popularRoot) {
    return;
  }

  summaryRoot.innerHTML = `
    <div class="soft-card p-5">
      <div class="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 class="m-0 text-xl font-semibold text-stone-900">${escapeHtml(translate("search_results", "Search results"))}</h2>
          <p class="m-0 mt-2 text-sm text-stone-600">${escapeHtml(formatResultCount())}</p>
        </div>
        <span class="jw-badge jw-badge--approved">${escapeHtml(state.modeLabel)}</span>
      </div>
    </div>
  `;

  resultsRoot.innerHTML = state.results.length ? renderResults() : "";
  noResultsRoot.innerHTML = state.results.length ? "" : renderNoResults();
  popularRoot.hidden = Boolean(state.query);
  updateLanguageDOM(getLanguage());
}

function renderResults() {
  if (state.type === "all") {
    const grouped = groupByType(state.results);
    return Object.entries(grouped)
      .map(([type, items]) => `
        <section class="mb-6">
          <div class="mb-3 flex items-center justify-between gap-3">
            <h3 class="m-0 text-lg font-semibold text-stone-900">${escapeHtml(formatType(type))}</h3>
            <span class="jw-badge">${items.length}</span>
          </div>
          <div class="jw-list">
            ${items.map((item) => renderSearchCard(item)).join("")}
          </div>
        </section>
      `)
      .join("");
  }

  return `<div class="jw-list">${state.results.map((item) => renderSearchCard(item)).join("")}</div>`;
}

function renderSearchCard(item) {
  const meta = Array.isArray(item.meta) ? item.meta.filter(Boolean) : [];
  const sourceText = item.source_name
    ? currentLanguage() === "hi"
      ? `स्रोत: ${item.source_name}`
      : `Source: ${item.source_name}`
    : "";

  return `
    <article class="jw-card p-5">
      <div class="flex flex-wrap items-center gap-2">
        <span class="jw-badge">${escapeHtml(formatType(item.type))}</span>
        ${item.review_status ? `<span class="jw-badge jw-badge--approved">${escapeHtml(formatReview(item.review_status))}</span>` : ""}
      </div>
      <h3 class="mt-3 text-lg font-semibold text-stone-900">
        <a href="${escapeHtml(item.url || "/search.html")}" class="hover:text-amber-800">${highlightMatch(item.title || "Untitled")}</a>
      </h3>
      <p class="m-0 mt-2 text-sm leading-7 text-stone-600">${highlightMatch(item.summary || copy().noSummary)}</p>
      <div class="jw-meta mt-3">
        ${meta.map((entry) => `<span>${escapeHtml(entry)}</span>`).join("")}
        ${sourceText ? `<span>${escapeHtml(sourceText)}</span>` : ""}
      </div>
      <div class="mt-4">
        <a href="${escapeHtml(item.url || "/search.html")}" class="text-sm font-semibold text-amber-800 hover:text-amber-900">${escapeHtml(translate("view_result", "View result"))}</a>
      </div>
    </article>
  `;
}

function renderNoResults() {
  return `
    <div class="soft-card p-5">
      <h3 class="m-0 text-lg font-semibold text-stone-900">${escapeHtml(translate("no_results_found", "No results found"))}</h3>
      <p class="m-0 mt-2 text-sm leading-7 text-stone-600">${escapeHtml(copy().noResultsHelp)}</p>
      <div class="mt-4 flex flex-wrap gap-2">
        ${POPULAR_SEARCHES.slice(0, 5)
          .map((item) => `<a class="topic-chip" href="/search.html?q=${encodeURIComponent(item.en)}">${escapeHtml(localizedLabel(item))}</a>`)
          .join("")}
      </div>
    </div>
  `;
}

function renderPopularSearches() {
  const root = document.getElementById("popular-searches");
  if (!root) {
    return;
  }

  root.innerHTML = `
    <div class="soft-card p-5">
      <h2 class="m-0 text-xl font-semibold text-stone-900">${escapeHtml(translate("popular_searches", "Popular searches"))}</h2>
      <div class="mt-4 flex flex-wrap gap-2">
        ${POPULAR_SEARCHES.map((item) => `<a class="topic-chip" href="/search.html?q=${encodeURIComponent(item.en)}">${escapeHtml(localizedLabel(item))}</a>`).join("")}
      </div>
    </div>
  `;
}

function renderIntroState() {
  const summaryRoot = document.getElementById("search-summary");
  const resultsRoot = document.getElementById("search-results");
  const noResultsRoot = document.getElementById("search-no-results");
  const popularRoot = document.getElementById("popular-searches");

  if (summaryRoot) {
    summaryRoot.innerHTML = `
      <div class="soft-card p-5">
        <h2 class="m-0 text-xl font-semibold text-stone-900">${escapeHtml(copy().introHeading)}</h2>
        <p class="m-0 mt-2 text-sm text-stone-600">${escapeHtml(copy().introText)}</p>
      </div>
    `;
  }

  if (resultsRoot) {
    resultsRoot.innerHTML = "";
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

function updateAskLink(query) {
  const link = document.getElementById("search-ask-link");
  if (link) {
    link.href = query ? `/ask.html?q=${encodeURIComponent(query)}` : "/ask.html";
  }
}

function updateUrl(query, type) {
  const url = new URL(window.location.href);
  query ? url.searchParams.set("q", query) : url.searchParams.delete("q");
  type && type !== "all" ? url.searchParams.set("type", type) : url.searchParams.delete("type");
  window.history.replaceState({}, "", url);
}

function groupByType(results) {
  return results.reduce((groups, item) => {
    const type = item.type || "all";
    groups[type] ||= [];
    groups[type].push(item);
    return groups;
  }, {});
}

function normalizeType(type) {
  const value = String(type || "all").toLowerCase();
  return SEARCH_TYPES.includes(value) ? value : "all";
}

function formatType(type) {
  const labels = TYPE_LABELS[String(type || "all").toLowerCase()];
  return labels ? labels[currentLanguage()] || labels.en : String(type || "");
}

function formatReview(review) {
  const normalized = String(review || "").toLowerCase();
  if (normalized === "verified") {
    return translate("verified", "Verified");
  }
  if (normalized === "approved" || normalized === "published") {
    return translate("curated", "Curated");
  }
  return review || "";
}

function formatResultCount() {
  if (currentLanguage() === "hi") {
    return `"${state.query}" के लिए ${state.results.length} परिणाम ${state.searchTime} मि.से. में मिले`;
  }
  return `${state.results.length} result(s) for "${state.query}" in ${state.searchTime} ms`;
}

function localizedLabel(item) {
  return currentLanguage() === "hi" ? item.hi || item.en : item.en;
}

function highlightMatch(text) {
  const safeText = escapeHtml(text);
  const query = String(state.query || "").trim();
  if (!query) {
    return safeText;
  }

  const escapedQuery = query.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return safeText.replace(new RegExp(`(${escapedQuery})`, "ig"), "<mark>$1</mark>");
}

function currentLanguage() {
  return getLanguage() === "hi" ? "hi" : "en";
}

function copy() {
  return currentLanguage() === "hi"
    ? {
        loading: "JainWorld में खोज हो रही है...",
        fallbackMode: "नमूना बैकअप मोड",
        searchMode: "JainWorld खोज",
        noResultsHelp: "छोटी खोज, अलग सामग्री प्रकार, या पर्व, प्रार्थना, स्थान, भोजन नियम या छात्रवृत्ति जैसे विषय से शुरुआत करें।",
        introHeading: "किसी विषय, प्रार्थना, स्थान, पर्व या संसाधन से शुरुआत करें",
        introText: "जैन साहित्य, मंदिर, ऑडियो, भोजन मार्गदर्शन, समाचार, छात्रवृत्ति और सीखने के मार्गों में खोजें।",
        noSummary: "सारांश उपलब्ध नहीं है।"
      }
    : {
        loading: "Searching JainWorld...",
        fallbackMode: "Sample fallback mode",
        searchMode: "JainWorld search",
        noResultsHelp: "Try a shorter search, switch content type, or begin with a festival, prayer, place, food rule, or scholarship topic.",
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
