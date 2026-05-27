import { getBooks } from "./api.js";
import { getLanguage, translate, updateLanguageDOM } from "./language.js";

let allItems = [];

document.addEventListener("DOMContentLoaded", async () => {
  if (document.body.dataset.page !== "books") {
    return;
  }

  allItems = await getBooks({ limit: 200 });
  bindControls();
  renderBooks();
  updateLanguageDOM(getLanguage());
});

window.addEventListener("jainworld:language-change", () => {
  if (document.body.dataset.page !== "books") {
    return;
  }

  renderBooks();
  updateLanguageDOM(getLanguage());
});

function bindControls() {
  const ids = ["books-search", "books-permission-filter"];
  ids.forEach((id) => {
    const node = document.getElementById(id);
    if (!node || node.dataset.bound === "true") {
      return;
    }

    node.dataset.bound = "true";
    node.addEventListener("input", renderBooks);
    node.addEventListener("change", renderBooks);
  });
}

function renderBooks() {
  const root = document.getElementById("books-list");
  if (!root) {
    return;
  }

  const query = String(document.getElementById("books-search")?.value || "").trim().toLowerCase();
  const permissionFilter = String(document.getElementById("books-permission-filter")?.value || "all");
  const lang = getLanguage();

  const filtered = allItems.filter((item) => {
    const matchesQuery = !query || JSON.stringify(item).toLowerCase().includes(query);
    const matchesPermission =
      permissionFilter === "all" ||
      String(item.license_status || "").toLowerCase() === permissionFilter ||
      (permissionFilter === "external_link_only" && item.external_link_only === true);

    return matchesQuery && matchesPermission;
  });

  if (!filtered.length) {
    root.innerHTML = `<div class="soft-card p-5"><p class="m-0 text-sm text-stone-600">${escapeHtml(
      translate("no_results_found", "No results found")
    )}</p></div>`;
    return;
  }

  root.innerHTML = `
    <div class="content-grid" data-columns="2">
      ${filtered
        .map((item) => {
          const title = lang === "hi" ? item.title_hi || item.title : item.title;
          const summary = lang === "hi" ? item.summary_hi || item.summary : item.summary;
          const author = lang === "hi" ? item.author_hi || item.author : item.author;
          const permissionBadge = item.external_link_only
            ? translate("external_link_only", "External link only")
            : formatStatusBadge(item.license_status);

          return `
            <article class="source-card">
              <div class="flex flex-wrap gap-2">
                <span class="jw-badge">${escapeHtml(item.category || translate("books", "Books"))}</span>
                ${permissionBadge ? `<span class="jw-badge">${escapeHtml(permissionBadge)}</span>` : ""}
                <span class="jw-badge">${escapeHtml(item.review_status || "needs_review")}</span>
              </div>
              <h2>${escapeHtml(title)}</h2>
              ${author ? `<p><strong>${escapeHtml(translate("author", "Author"))}:</strong> ${escapeHtml(author)}</p>` : ""}
              <p>${escapeHtml(summary || translate("not_available_yet", "Not available yet"))}</p>
              ${item.source_name ? `<p><strong>${escapeHtml(translate("source", "Source"))}:</strong> ${escapeHtml(item.source_name)}</p>` : ""}
              ${item.attribution_text ? `<p><strong>${escapeHtml(translate("credit", "Credit"))}:</strong> ${escapeHtml(item.attribution_text)}</p>` : ""}
              <div class="detail-cta">
                ${item.source_url ? `<a href="${escapeHtml(item.source_url)}" target="_blank" rel="noopener noreferrer" class="jw-button jw-button--ghost">${escapeHtml(translate("open_source", "Open source"))}</a>` : ""}
                <a href="/corrections.html?topic=copyright" class="jw-button jw-button--secondary">${escapeHtml(
                  translate("report_copyright_concern", "Report copyright concern")
                )}</a>
              </div>
            </article>
          `;
        })
        .join("")}
    </div>
  `;
}

function formatStatusBadge(value) {
  const key = String(value || "").trim().toLowerCase();
  if (!key) {
    return "";
  }

  const map = {
    public_domain: translate("public_domain", "Public domain"),
    permission_received: translate("permission_received", "Permission received"),
    metadata_only: translate("metadata_only", "Metadata only"),
    creative_commons: translate("creative_commons", "Creative Commons"),
    needs_review: translate("needs_review", "Needs review")
  };

  return map[key] || value;
}

function escapeHtml(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}
