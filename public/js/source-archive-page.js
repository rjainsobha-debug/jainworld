import { getLanguage, pickLocalized, translate, updateLanguageDOM } from "./language.js";
import { getSourceArchive } from "./api.js";

async function initSourceArchivePage() {
  const root = document.getElementById("source-archive-app");
  if (!root) {
    return;
  }

  const items = await getSourceArchive({ includeDrafts: true });
  renderSourceArchive(root, Array.isArray(items) ? items : []);

  window.addEventListener("jainworld:language-change", () => {
    renderSourceArchive(root, Array.isArray(items) ? items : []);
  });
}

function renderSourceArchive(root, items) {
  const lang = getLanguage();

  root.innerHTML = `
    <section class="detail-section">
      <div class="jw-section-title">
        <div>
          <span class="jw-kicker">${translate("source_archive", "Source Archive")}</span>
          <h2 class="mt-3 text-2xl font-semibold tracking-tight text-stone-900">${translate("source_archive", "Source Archive")}</h2>
        </div>
      </div>
      <p class="m-0 text-sm leading-7 text-stone-600">
        ${escapeHtml(
          lang === "hi"
            ? "यह सूची केवल सार्वजनिक स्रोतों, श्रेय, अनुमति स्थिति और समीक्षा नोट का पारदर्शी रिकॉर्ड है।"
            : "This list is a transparent record of public sources, credit, permission status, and review notes only."
        )}
      </p>
    </section>
    <div class="calendar-list">
      ${items.map((item) => renderSourceCard(item, lang)).join("")}
    </div>
  `;

  updateLanguageDOM(lang);
}

function renderSourceCard(item, lang) {
  const name = pickLocalized(item, "source_name", lang) || item.source_name || "";
  const notes = pickLocalized(item, "notes", lang) || item.notes || "";
  const permission = item.permission_status || item.review_status || "pending_review";
  const sourceType = item.source_type || "manual_review";

  return `
    <article class="calendar-event-card">
      <div class="flex flex-wrap items-center gap-2">
        <span class="jw-badge">${escapeHtml(sourceType)}</span>
        <span class="calendar-confidence-badge calendar-confidence--review">${escapeHtml(permission)}</span>
      </div>
      <h3>${escapeHtml(name)}</h3>
      <p>${escapeHtml(item.attribution_text || "")}</p>
      <div class="jw-meta">
        <span>${translate("source", "Source")}: ${escapeHtml(item.source_site || item.source_url || "")}</span>
        <span>${translate("reviewed", "Reviewed")}: ${escapeHtml(item.review_status || "pending_review")}</span>
      </div>
      <div class="calendar-source-note">
        <strong>${translate("source_credit", "Source Credit")}</strong>
        <p>${escapeHtml(notes)}</p>
      </div>
      <div class="detail-cta">
        ${
          item.source_url
            ? `<a class="jw-btn jw-btn-secondary" href="${escapeHtml(item.source_url)}" target="_blank" rel="noopener noreferrer">
                ${translate("open_original_source", "Open Original Source")}
              </a>`
            : ""
        }
        <a class="jw-btn" href="/corrections.html?topic=source-archive">
          ${translate("report_source_concern", "Report source concern")}
        </a>
      </div>
    </article>
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

initSourceArchivePage();
