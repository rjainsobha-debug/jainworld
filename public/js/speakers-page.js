import { getSpeakers } from "./api.js";
import { getLanguage, translate, updateLanguageDOM } from "./language.js";

let allItems = [];

document.addEventListener("DOMContentLoaded", async () => {
  if (document.body.dataset.page !== "speakers") {
    return;
  }

  allItems = await getSpeakers({ limit: 200 });
  bindSpeakersControls();
  renderSpeakers();
  updateLanguageDOM(getLanguage());
});

window.addEventListener("jainworld:language-change", () => {
  if (document.body.dataset.page !== "speakers") {
    return;
  }

  renderSpeakers();
  updateLanguageDOM(getLanguage());
});

function bindSpeakersControls() {
  const input = document.getElementById("speakers-search");
  if (input && input.dataset.bound !== "true") {
    input.dataset.bound = "true";
    input.addEventListener("input", renderSpeakers);
  }
}

function renderSpeakers() {
  const root = document.getElementById("speakers-list");
  if (!root) {
    return;
  }

  const query = String(document.getElementById("speakers-search")?.value || "").trim().toLowerCase();
  const filtered = allItems.filter((item) => !query || JSON.stringify(item).toLowerCase().includes(query));

  if (!filtered.length) {
    root.innerHTML = `<div class="soft-card p-5"><p class="m-0 text-sm text-stone-600">${escapeHtml(translate("no_results_found", "No results found"))}</p></div>`;
    return;
  }

  root.innerHTML = `
    <div class="content-grid" data-columns="2">
      ${filtered
        .map((item) => {
          const name = getLanguage() === "hi" ? item.name_hi || item.name : item.name;
          const summary = getLanguage() === "hi" ? item.summary_hi || item.summary : item.summary;
          return `
            <article class="soft-card p-5">
              <div class="flex flex-wrap gap-2">
                <span class="jw-badge">${escapeHtml(item.tradition_or_context || "General")}</span>
                <span class="jw-badge">${escapeHtml(item.review_status || "review")}</span>
                <span class="jw-badge">${escapeHtml(item.permission_status || "needs_review")}</span>
              </div>
              <h2 class="mt-4 text-2xl font-semibold text-stone-900">${escapeHtml(name)}</h2>
              <p class="m-0 mt-3 text-base leading-8 text-stone-700">${escapeHtml(summary || "")}</p>
              <div class="jw-meta mt-4">
                ${item.topics ? `<span>${escapeHtml(item.topics)}</span>` : ""}
                ${item.related_audio ? `<span>${escapeHtml(item.related_audio)}</span>` : ""}
                ${item.related_literature ? `<span>${escapeHtml(item.related_literature)}</span>` : ""}
              </div>
              <div class="mt-4 flex flex-wrap gap-3">
                ${item.related_audio ? `<a href="/search.html?q=${encodeURIComponent(item.related_audio)}&type=audio" class="text-amber-800 hover:text-amber-900">${escapeHtml(translate("audio", "Audio"))}</a>` : ""}
                ${item.related_literature ? `<a href="/search.html?q=${encodeURIComponent(item.related_literature)}&type=literature" class="text-amber-800 hover:text-amber-900">${escapeHtml(translate("literature", "Literature"))}</a>` : ""}
              </div>
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
