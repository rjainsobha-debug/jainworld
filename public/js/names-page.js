import { getNames } from "./api.js";
import { getLanguage, translate, updateLanguageDOM } from "./language.js";

let allItems = [];

document.addEventListener("DOMContentLoaded", async () => {
  if (document.body.dataset.page !== "names") {
    return;
  }

  allItems = await getNames({ limit: 200 });
  bindNamesControls();
  renderNames();
  updateLanguageDOM(getLanguage());
});

window.addEventListener("jainworld:language-change", () => {
  if (document.body.dataset.page !== "names") {
    return;
  }

  renderNames();
  updateLanguageDOM(getLanguage());
});

function bindNamesControls() {
  ["names-search", "names-gender"].forEach((id) => {
    const node = document.getElementById(id);
    if (node && node.dataset.bound !== "true") {
      node.dataset.bound = "true";
      node.addEventListener("input", renderNames);
      node.addEventListener("change", renderNames);
    }
  });
}

function renderNames() {
  const root = document.getElementById("names-list");
  if (!root) {
    return;
  }

  const query = String(document.getElementById("names-search")?.value || "").trim().toLowerCase();
  const gender = String(document.getElementById("names-gender")?.value || "").trim().toLowerCase();

  const filtered = allItems.filter((item) => {
    if (gender && String(item.gender || "").toLowerCase() !== gender) {
      return false;
    }
    return !query || JSON.stringify(item).toLowerCase().includes(query);
  });

  if (!filtered.length) {
    root.innerHTML = `<div class="soft-card p-5"><p class="m-0 text-sm text-stone-600">${escapeHtml(translate("no_results_found", "No results found"))}</p></div>`;
    return;
  }

  root.innerHTML = `
    <div class="content-grid" data-columns="3">
      ${filtered
        .map((item) => {
          const name = getLanguage() === "hi" ? item.name_hi || item.name : item.name;
          const meaning = getLanguage() === "hi" ? item.meaning_hi || item.meaning : item.meaning;
          return `
            <article class="soft-card p-5">
              <div class="flex flex-wrap gap-2">
                <span class="jw-badge">${escapeHtml(item.gender || "name")}</span>
                <span class="jw-badge">${escapeHtml(item.review_status || "review")}</span>
              </div>
              <h2 class="mt-4 text-2xl font-semibold text-stone-900">${escapeHtml(name)}</h2>
              <p class="m-0 mt-3 text-base leading-8 text-stone-700">${escapeHtml(meaning || "")}</p>
              ${item.source_note ? `<p class="m-0 mt-3 text-sm leading-7 text-stone-600">${escapeHtml(item.source_note)}</p>` : ""}
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
