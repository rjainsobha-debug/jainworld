import { getDictionary } from "./api.js";
import { getLanguage, translate, updateLanguageDOM } from "./language.js";

let allItems = [];

document.addEventListener("DOMContentLoaded", async () => {
  if (document.body.dataset.page !== "dictionary") {
    return;
  }

  allItems = await getDictionary({ limit: 200 });
  bindDictionaryControls();
  renderDictionary();
  updateLanguageDOM(getLanguage());
});

window.addEventListener("jainworld:language-change", () => {
  if (document.body.dataset.page !== "dictionary") {
    return;
  }

  renderDictionary();
  updateLanguageDOM(getLanguage());
});

function bindDictionaryControls() {
  const input = document.getElementById("dictionary-search");
  if (input && input.dataset.bound !== "true") {
    input.dataset.bound = "true";
    input.addEventListener("input", renderDictionary);
  }
}

function renderDictionary() {
  const root = document.getElementById("dictionary-list");
  if (!root) {
    return;
  }

  const query = String(document.getElementById("dictionary-search")?.value || "").trim().toLowerCase();
  const filtered = allItems.filter((item) => !query || JSON.stringify(item).toLowerCase().includes(query));

  if (!filtered.length) {
    root.innerHTML = `<div class="soft-card p-5"><p class="m-0 text-sm text-stone-600">${escapeHtml(translate("no_results_found", "No results found"))}</p></div>`;
    return;
  }

  root.innerHTML = `
    <div class="content-grid" data-columns="2">
      ${filtered
        .map((item) => {
          const term = getLanguage() === "hi" ? item.term_hi || item.term : item.term;
          const meaning = getLanguage() === "hi" ? item.simple_meaning_hi || item.simple_meaning : item.simple_meaning;
          return `
            <article class="soft-card p-5">
              <div class="flex flex-wrap gap-2">
                <span class="jw-badge">${escapeHtml(item.category || "Dictionary")}</span>
                <span class="jw-badge">${escapeHtml(item.review_status || "review")}</span>
              </div>
              <h2 class="mt-4 text-2xl font-semibold text-stone-900">${escapeHtml(term)}</h2>
              <p class="m-0 mt-3 text-base leading-8 text-stone-700">${escapeHtml(meaning)}</p>
              ${item.related_links ? `<p class="m-0 mt-4"><a href="${escapeHtml(item.related_links)}" class="text-amber-800 hover:text-amber-900">${escapeHtml(translate("explore", "Explore"))}</a></p>` : ""}
            </article>
          `;
        })
        .join("")}
    </div>
  `;
}

function escapeHtml(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}
