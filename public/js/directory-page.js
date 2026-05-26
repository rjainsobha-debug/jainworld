import { getDirectory } from "./api.js";
import { getLanguage, translate, translateLabel, updateLanguageDOM } from "./language.js";

let allItems = [];

document.addEventListener("DOMContentLoaded", async () => {
  if (document.body.dataset.page !== "directory") {
    return;
  }

  await initDirectoryPage();
});

window.addEventListener("jainworld:language-change", () => {
  if (document.body.dataset.page !== "directory") {
    return;
  }

  renderDirectory(allItems, getQuery());
  updateLanguageDOM(getLanguage());
});

async function initDirectoryPage() {
  allItems = await getDirectory({ limit: 200 });
  bindControls();
  renderDirectory(allItems, getQuery());
  updateLanguageDOM(getLanguage());
}

function bindControls() {
  const searchInput = document.getElementById("directory-search");
  const categoryFilter = new URLSearchParams(window.location.search).get("category") || "";

  if (searchInput && searchInput.dataset.bound !== "true") {
    searchInput.dataset.bound = "true";
    searchInput.addEventListener("input", () => renderDirectory(allItems, getQuery()));
  }

  if (searchInput && categoryFilter && !searchInput.value) {
    searchInput.value = categoryFilter;
  }
}

function getQuery() {
  return String(document.getElementById("directory-search")?.value || "").trim().toLowerCase();
}

function renderDirectory(items, query) {
  renderSummary(items);
  renderChips(items);

  const filtered = items.filter((item) => {
    if (!query) {
      return true;
    }

    return JSON.stringify(item).toLowerCase().includes(query);
  });

  const grouped = filtered.reduce((accumulator, item) => {
    const key = item.category || "Directory";
    if (!accumulator[key]) {
      accumulator[key] = [];
    }
    accumulator[key].push(item);
    return accumulator;
  }, {});

  const root = document.getElementById("directory-groups");
  if (!root) {
    return;
  }

  if (!filtered.length) {
    root.innerHTML = `
      <div class="soft-card p-5">
        <h2 class="m-0 text-xl font-semibold text-stone-900">${escapeHtml(translate("no_results_found", "No results found"))}</h2>
        <p class="m-0 mt-3 text-sm leading-7 text-stone-600">${escapeHtml(translate("try_another_search", "Try another search"))}</p>
      </div>
    `;
    return;
  }

  root.innerHTML = Object.entries(grouped)
    .map(([category, groupItems]) => {
      const first = groupItems[0] || {};
      const heading = getLanguage() === "hi" ? first.category_hi || translateLabel(category, category) : category;
      return `
        <section class="related-content">
          <div class="section-header">
            <span class="section-kicker">${escapeHtml(heading)}</span>
            <h2>${escapeHtml(heading)}</h2>
          </div>
          <div class="content-grid" data-columns="3">
            ${groupItems.map((item) => renderCard(item)).join("")}
          </div>
        </section>
      `;
    })
    .join("");
}

function renderSummary(items) {
  const root = document.getElementById("directory-summary");
  if (!root) {
    return;
  }

  const categories = new Set(items.map((item) => item.category).filter(Boolean)).size;
  const reviewed = items.filter((item) => item.review_status === "verified" || item.review_status === "curated").length;
  const pending = items.filter((item) => item.review_status === "needs_review").length;

  root.innerHTML = `
    <article class="soft-card p-5">
      <span class="section-kicker">${escapeHtml(translate("directory", "Directory"))}</span>
      <h2 class="mt-3 text-3xl font-bold tracking-tight text-stone-900">${items.length}</h2>
      <p class="m-0 mt-2 text-sm text-stone-600">${escapeHtml(getLanguage() === "hi" ? "कुल निर्देशिका प्रविष्टियाँ" : "Total directory entries")}</p>
    </article>
    <article class="soft-card p-5">
      <span class="section-kicker">${escapeHtml(translate("resources", "Resources"))}</span>
      <h2 class="mt-3 text-3xl font-bold tracking-tight text-stone-900">${categories}</h2>
      <p class="m-0 mt-2 text-sm text-stone-600">${escapeHtml(getLanguage() === "hi" ? "मुख्य श्रेणी समूह" : "Major category groups")}</p>
    </article>
    <article class="soft-card p-5">
      <span class="section-kicker">${escapeHtml(translate("reviewed", "Reviewed"))}</span>
      <h2 class="mt-3 text-3xl font-bold tracking-tight text-stone-900">${reviewed}</h2>
      <p class="m-0 mt-2 text-sm text-stone-600">${escapeHtml(getLanguage() === "hi" ? `${pending} प्रविष्टियाँ अभी समीक्षा में हैं` : `${pending} entries are still review-first`)}</p>
    </article>
  `;
}

function renderChips(items) {
  const root = document.getElementById("directory-filter-chips");
  if (!root) {
    return;
  }

  const categories = [...new Set(items.map((item) => item.category).filter(Boolean))];
  root.innerHTML = categories
    .map((category) => {
      const localized = translateLabel(category, category);
      return `<button type="button" class="topic-chip" data-directory-chip="${escapeHtml(category)}">${escapeHtml(localized)}</button>`;
    })
    .join("");

  root.querySelectorAll("[data-directory-chip]").forEach((button) => {
    if (button.dataset.bound === "true") {
      return;
    }

    button.dataset.bound = "true";
    button.addEventListener("click", () => {
      const searchInput = document.getElementById("directory-search");
      if (searchInput) {
        searchInput.value = button.getAttribute("data-directory-chip") || "";
      }
      renderDirectory(allItems, getQuery());
    });
  });
}

function renderCard(item) {
  const lang = getLanguage();
  const title = lang === "hi" ? item.title_hi || translateLabel(item.title, item.title) : item.title;
  const summary = lang === "hi" ? item.summary_hi || item.summary : item.summary;
  const category = lang === "hi" ? item.category_hi || translateLabel(item.category, item.category) : item.category;
  const status = translateLabel(item.review_status || "", item.review_status || "");

  return `
    <a href="${escapeHtml(item.url || "/resources.html")}" class="feature-card">
      <div class="category-visual category-visual--${escapeHtml(item.icon_type || "resources")}">
        <span class="category-visual__icon" aria-hidden="true">${escapeHtml(getIconText(item.icon_type))}</span>
        <span class="category-visual__label">${escapeHtml(category || translate("directory", "Directory"))}</span>
      </div>
      <div class="mt-4 flex flex-wrap gap-2">
        <span class="jw-badge">${escapeHtml(category || translate("directory", "Directory"))}</span>
        <span class="jw-badge">${escapeHtml(status || item.review_status || "review")}</span>
      </div>
      <h3 class="mt-4">${escapeHtml(title || item.title || "Directory item")}</h3>
      <p>${escapeHtml(summary || "")}</p>
    </a>
  `;
}

function getIconText(iconType) {
  const map = {
    literature: getLanguage() === "hi" ? "ज्ञान" : "Study",
    philosophy: getLanguage() === "hi" ? "दर्शन" : "Ideas",
    temples: getLanguage() === "hi" ? "तीर्थ" : "Temple",
    food: getLanguage() === "hi" ? "आहार" : "Food",
    audio: getLanguage() === "hi" ? "श्रवण" : "Audio",
    resources: getLanguage() === "hi" ? "सहाय" : "Guide",
    calendar: getLanguage() === "hi" ? "पर्व" : "Dates",
    children: getLanguage() === "hi" ? "परिवार" : "Family",
    course: getLanguage() === "hi" ? "अध्ययन" : "Learn"
  };
  return map[iconType] || (getLanguage() === "hi" ? "जैन" : "Jain");
}

function escapeHtml(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}
