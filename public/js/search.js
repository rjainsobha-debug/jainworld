import { searchAll } from "./api.js";
import { renderGroupedSearch } from "./render.js";

export function initGlobalSearch() {
  const overlay = document.getElementById("search-overlay");
  const resultRoot = document.getElementById("search-overlay-results");
  const closeButton = document.getElementById("search-overlay-close");
  const subtitle = document.getElementById("search-overlay-subtitle");

  document.querySelectorAll("[data-global-search-form]").forEach((form) => {
    if (form.dataset.bound === "true") {
      return;
    }

    form.dataset.bound = "true";

    form.addEventListener("submit", async (event) => {
      event.preventDefault();
      const input = form.querySelector("[data-global-search-input], input[name='q']");
      const query = input?.value?.trim() || "";

      if (!query || !overlay || !resultRoot) {
        return;
      }

      overlay.classList.add("is-open");
      overlay.setAttribute("aria-hidden", "false");
      resultRoot.innerHTML = `<div class="jw-card p-5 text-sm text-stone-600">Searching for "${query}"...</div>`;
      if (subtitle) {
        subtitle.textContent = `Showing grouped results for "${query}".`;
      }

      const results = await searchAll(query, { limit: 50 });
      const groups = groupByType(results);
      renderGroupedSearch(resultRoot, groups, query);
    });
  });

  if (closeButton && overlay && !closeButton.dataset.bound) {
    closeButton.dataset.bound = "true";
    closeButton.addEventListener("click", () => closeOverlay(overlay));
  }

  if (overlay && !overlay.dataset.bound) {
    overlay.dataset.bound = "true";
    overlay.addEventListener("click", (event) => {
      if (event.target === overlay) {
        closeOverlay(overlay);
      }
    });
  }
}

function closeOverlay(overlay) {
  overlay.classList.remove("is-open");
  overlay.setAttribute("aria-hidden", "true");
}

function groupByType(results) {
  const grouped = {
    blogs: [],
    literature: [],
    temples: [],
    food: [],
    education: [],
    news: []
  };

  results.forEach((item) => {
    const type = item.type || "blogs";
    if (!grouped[type]) {
      grouped[type] = [];
    }
    grouped[type].push(item);
  });

  return grouped;
}

