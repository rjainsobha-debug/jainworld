import { getCalendar } from "./api.js";
import { getLanguage, pickLocalized, translate, translateLabel } from "./language.js";

const calendarState = {
  items: [],
  reviewItems: [],
  filter: "all"
};

const FILTERS = [
  { key: "all", labelEn: "All", labelHi: "सभी" },
  { key: "festival", labelEn: "Festivals", labelHi: "पर्व" },
  { key: "vrat", labelEn: "Tithi / Vrat", labelHi: "तिथि / व्रत" },
  { key: "ayambil", labelEn: "Ayambil", labelHi: "आयंबिल" },
  { key: "learning", labelEn: "Learning", labelHi: "शैक्षणिक जानकारी" },
  { key: "needs_review", labelEn: "Needs Review", labelHi: "समीक्षा आवश्यक" }
];

export async function initCalendarPage() {
  const root = document.getElementById("calendar-app");
  if (!root) {
    return;
  }

  const [items, reviewItems] = await Promise.all([getCalendar({ limit: 100 }), loadReviewEvents()]);
  calendarState.items = Array.isArray(items) ? items : [];
  calendarState.reviewItems = Array.isArray(reviewItems) ? reviewItems : [];
  renderCalendar(root);
}

async function loadReviewEvents() {
  try {
    const response = await fetch("/data/review-calendar-events.json");
    if (!response.ok) {
      return [];
    }
    return await response.json();
  } catch (error) {
    console.warn("Calendar review fallback failed", error);
    return [];
  }
}

function renderCalendar(root) {
  const lang = getLanguage();
  const items = getFilteredItems();

  root.innerHTML = `
    <div class="jw-page-stack">
      <section class="jw-card p-5 lg:p-6">
        <div class="jw-grid-2">
          <div>
            <span class="jw-kicker">${translate("jain_calendar_and_festivals", "Jain Calendar and Festivals")}</span>
            <h2 class="mt-3 text-2xl font-semibold tracking-tight text-stone-900">${translate(
              "dates_may_vary",
              "Dates may vary"
            )}</h2>
            <p class="m-0 mt-3 text-stone-700 leading-8">${escapeHtml(getTrustNotice(lang))}</p>
          </div>
          <div class="jw-soft-surface p-5">
            <div class="jw-meta">
              <span>${translate("date_confidence", "Date confidence")}</span>
              <span>${translate("tradition_scope", "Tradition scope")}</span>
              <span>${translate("location_scope", "Location scope")}</span>
            </div>
            <div class="mt-4 jw-inline-scroll">
              ${FILTERS.map((filter) => renderFilterButton(filter, lang)).join("")}
            </div>
            <div class="mt-4 flex flex-wrap gap-3">
              <span class="jw-badge jw-badge--verified">${translate("verified_date", "Verified date")}</span>
              <span class="jw-badge jw-badge--approved">${translate("source_provided", "Source provided")}</span>
              <span class="jw-badge jw-badge--pending-review">${translate("needs_review", "Needs Review")}</span>
              <span class="jw-badge jw-badge--draft">${translate("educational_overview", "Educational overview")}</span>
            </div>
          </div>
        </div>
      </section>
      <section class="jw-grid-3" id="calendar-cards">
        ${items.length ? items.map((item) => renderCalendarCard(item, lang)).join("") : renderEmptyState()}
      </section>
      <section class="jw-page-cta">
        <div class="jw-grid-2 items-center">
          <div>
            <span class="jw-kicker">${translate("report_calendar_correction", "Report calendar correction")}</span>
            <h2 class="mt-3 text-2xl font-semibold tracking-tight">${translate(
              "verify_with_local_sangh",
              "Verify with local sangh"
            )}</h2>
            <p class="m-0 mt-3">${escapeHtml(getFooterNote(lang))}</p>
          </div>
          <div class="jw-page-actions lg:justify-end">
            <a class="jw-btn" href="/corrections.html">${translate(
              "report_calendar_correction",
              "Report calendar correction"
            )}</a>
            <a class="jw-btn jw-btn-secondary" href="/ask.html?q=${encodeURIComponent(
              lang === "hi" ? "पर्युषण क्या है?" : "What is Paryushan?"
            )}">${translate("ask_jainworld", "Ask JainWorld")}</a>
          </div>
        </div>
      </section>
    </div>
  `;

  root.querySelectorAll("[data-calendar-filter]").forEach((button) => {
    button.addEventListener("click", () => {
      calendarState.filter = button.getAttribute("data-calendar-filter") || "all";
      renderCalendar(root);
    });
  });
}

function getFilteredItems() {
  const allItems = [...calendarState.items, ...calendarState.reviewItems];

  return allItems.filter((item) => {
    if (calendarState.filter === "all") {
      return true;
    }

    if (calendarState.filter === "festival") {
      return item.type === "festival" || item.type === "event";
    }

    if (calendarState.filter === "vrat") {
      return item.type === "vrat" || item.type === "tithi";
    }

    if (calendarState.filter === "ayambil") {
      return item.type === "ayambil";
    }

    if (calendarState.filter === "learning") {
      return String(item.date_confidence || "").toLowerCase() === "educational_only";
    }

    if (calendarState.filter === "needs_review") {
      return String(item.date_confidence || "").toLowerCase() === "needs_review";
    }

    return true;
  });
}

function renderFilterButton(filter, lang) {
  const isActive = calendarState.filter === filter.key;
  const label = lang === "hi" ? filter.labelHi : filter.labelEn;
  return `<button type="button" class="prayer-chip ${isActive ? "is-active" : ""}" data-calendar-filter="${filter.key}">${escapeHtml(
    label
  )}</button>`;
}

function renderCalendarCard(item, lang) {
  const localizedTitle = pickLocalized(item, "title", lang) || item.title || translate("jain_calendar", "Jain Calendar");
  const localizedSummary =
    pickLocalized(item, "summary", lang) ||
    item.summary ||
    translate("educational_overview", "Educational overview");
  const dateBadge = renderConfidenceBadge(item.date_confidence);
  const dateLine = renderDateLine(item, lang);
  const sourceLine = item.source_name
    ? `<p class="m-0 mt-3 text-sm leading-7 text-stone-700"><strong>${translate("source", "Source")}:</strong> ${escapeHtml(
        item.source_name
      )}</p>`
    : "";
  const caution = pickLocalized(item, "caution_note", lang) || item.caution_note || getLocalVerifyCopy(lang);
  const sourceNote = pickLocalized(item, "source_note", lang) || item.source_note || "";
  const tradition = translateLabel(item.tradition_scope || "", item.tradition_scope || "");
  const location = item.location_scope || translate("not_available_yet", "Not available yet");
  const lunarMeta = [
    item.lunar_month
      ? `<span><strong>${translate("lunar_month", "Lunar month")}:</strong> ${escapeHtml(
          lang === "hi" ? item.lunar_month_hi || item.lunar_month : item.lunar_month
        )}</span>`
      : "",
    item.lunar_tithi
      ? `<span><strong>${translate("lunar_tithi", "Lunar tithi")}:</strong> ${escapeHtml(
          lang === "hi" ? item.lunar_tithi_hi || item.lunar_tithi : item.lunar_tithi
        )}</span>`
      : ""
  ]
    .filter(Boolean)
    .join("");

  return `
    <article class="jw-card p-5 calendar-review-card">
      <div class="flex flex-wrap items-center gap-2">
        <span class="jw-badge">${escapeHtml(translateLabel(item.type || "festival", item.type || "Festival"))}</span>
        ${dateBadge}
      </div>
      <h3 class="mt-4 text-xl font-semibold text-stone-900">${escapeHtml(localizedTitle)}</h3>
      <p class="m-0 mt-3 text-stone-700 leading-8">${escapeHtml(localizedSummary)}</p>
      ${dateLine}
      <div class="jw-meta mt-4">
        <span>${translate("tradition_scope", "Tradition scope")}: ${escapeHtml(tradition || translate("not_available_yet", "Not available yet"))}</span>
        <span>${translate("location_scope", "Location scope")}: ${escapeHtml(location)}</span>
      </div>
      ${lunarMeta ? `<div class="jw-meta mt-3">${lunarMeta}</div>` : ""}
      ${sourceLine}
      ${
        sourceNote
          ? `<p class="m-0 mt-3 text-sm leading-7 text-stone-600"><strong>${translate("source", "Source")}:</strong> ${escapeHtml(
              sourceNote
            )}</p>`
          : ""
      }
      <div class="detail-note mt-4">
        <h3>${translate("verify_with_local_sangh", "Verify with local sangh")}</h3>
        <p>${escapeHtml(caution)}</p>
      </div>
      <div class="detail-cta mt-4">
        <a class="jw-btn" href="${buildVerifyLink(item, lang)}">${translate(
          "local_verification_required",
          "Local verification required"
        )}</a>
        <a class="jw-btn jw-btn-secondary" href="/corrections.html">${translate(
          "report_calendar_correction",
          "Report calendar correction"
        )}</a>
      </div>
    </article>
  `;
}

function renderConfidenceBadge(confidence) {
  const key = String(confidence || "needs_review").toLowerCase();

  if (key === "verified") {
    return `<span class="jw-badge jw-badge--verified">${translate("verified_date", "Verified date")}</span>`;
  }

  if (key === "source_provided") {
    return `<span class="jw-badge jw-badge--approved">${translate("source_provided", "Source provided")}</span>`;
  }

  if (key === "educational_only") {
    return `<span class="jw-badge jw-badge--draft">${translate("educational_overview", "Educational overview")}</span>`;
  }

  return `<span class="jw-badge jw-badge--pending-review">${translate("needs_review", "Needs Review")}</span>`;
}

function renderDateLine(item, lang) {
  const confidence = String(item.date_confidence || "").toLowerCase();
  const dateText = lang === "hi" ? item.date_display_hi || item.date_display : item.date_display || item.date_display_hi;

  if (confidence === "educational_only") {
    return `<p class="m-0 mt-4 text-sm font-semibold text-stone-700">${translate(
      "educational_overview",
      "Educational overview"
    )}</p>`;
  }

  if (dateText) {
    return `<p class="m-0 mt-4 text-sm font-semibold text-stone-800">${escapeHtml(dateText)}</p>`;
  }

  return `<p class="m-0 mt-4 text-sm font-semibold text-amber-900">${translate(
    "needs_review",
    "Needs Review"
  )}</p>`;
}

function buildVerifyLink(item, lang) {
  const query = lang === "hi" ? `${item.title_hi || item.title} तिथि सत्यापन` : `${item.title} date verification`;
  return `/search.html?q=${encodeURIComponent(query)}`;
}

function renderEmptyState() {
  return `
    <article class="jw-card p-5 jw-empty-state">
      <h3 class="m-0 text-xl font-semibold text-stone-900">${translate("no_results_found", "No results found")}</h3>
      <p class="m-0 mt-3 text-stone-600">${translate(
        "try_another_search",
        "Try another search"
      )}</p>
    </article>
  `;
}

function getTrustNotice(lang) {
  if (lang === "hi") {
    return "जैन तिथियाँ पंचांग, स्थान, परंपरा और स्थानीय संघ की परंपरा के अनुसार भिन्न हो सकती हैं। महत्वपूर्ण पालन के लिए कृपया अपने स्थानीय संघ या विश्वसनीय पंचांग से सत्यापन करें।";
  }

  return "Jain dates may vary by panchang, location, tradition, and local sangh practice. Please verify important observances with your local sangh or trusted panchang.";
}

function getFooterNote(lang) {
  if (lang === "hi") {
    return "जैनवर्ल्ड शैक्षणिक जानकारी और समीक्षा-आधारित तिथि प्रविष्टियों को अलग रखता है। किसी भी धार्मिक निर्णय से पहले स्थानीय सत्यापन करें।";
  }

  return "JainWorld separates educational festival overviews from reviewed date records. Please verify locally before making any religious decision.";
}

function getLocalVerifyCopy(lang) {
  return lang === "hi"
    ? "कृपया स्थानीय संघ/पंचांग से सत्यापित करें।"
    : "Please verify with local sangh/panchang.";
}

function escapeHtml(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}
