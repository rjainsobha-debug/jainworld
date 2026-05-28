import { getCalendar } from "./api.js";
import { getLanguage, pickLocalized, translate, translateLabel, updateLanguageDOM } from "./language.js";

const MONTHS = [
  { value: 1, en: "January", hi: "जनवरी" },
  { value: 2, en: "February", hi: "फ़रवरी" },
  { value: 3, en: "March", hi: "मार्च" },
  { value: 4, en: "April", hi: "अप्रैल" },
  { value: 5, en: "May", hi: "मई" },
  { value: 6, en: "June", hi: "जून" },
  { value: 7, en: "July", hi: "जुलाई" },
  { value: 8, en: "August", hi: "अगस्त" },
  { value: 9, en: "September", hi: "सितंबर" },
  { value: 10, en: "October", hi: "अक्टूबर" },
  { value: 11, en: "November", hi: "नवंबर" },
  { value: 12, en: "December", hi: "दिसंबर" }
];

const WEEKDAYS = [
  { en: "Sun", hi: "रवि" },
  { en: "Mon", hi: "सोम" },
  { en: "Tue", hi: "मंगल" },
  { en: "Wed", hi: "बुध" },
  { en: "Thu", hi: "गुरु" },
  { en: "Fri", hi: "शुक्र" },
  { en: "Sat", hi: "शनि" }
];

const FILTERS = [
  { key: "all", translation: "all", fallback: "All" },
  { key: "festival", translation: "festivals", fallback: "Festivals" },
  { key: "tithi_vrat", translation: "tithi_vrat", fallback: "Tithi / Vrat" },
  { key: "ayambil", translation: "ayambil", fallback: "Ayambil" },
  { key: "ekadashi", translation: "ekadashi", fallback: "Ekadashi" },
  { key: "dwadashi", translation: "dwadashi", fallback: "Dwadashi" },
  { key: "chaudas", translation: "chaudas", fallback: "Chaudas" },
  { key: "learning", translation: "learning", fallback: "Learning" },
  { key: "needs_review", translation: "needs_review", fallback: "Needs Review" }
];

const IMPORTANT_FESTIVAL_KEYS = [
  "paryushan",
  "samvatsari",
  "das lakshan",
  "mahavir jayanti",
  "ayambil oli",
  "kartik purnima"
];

const DEFAULT_CAUTION_EN = "Dates can vary by panchang, location, tradition, and local sangh practice.";
const DEFAULT_CAUTION_HI = "तिथियाँ पंचांग, स्थान, परंपरा और स्थानीय संघ की परंपरा के अनुसार भिन्न हो सकती हैं।";
const DEFAULT_SOURCE_NOTE_EN = "Please verify with local sangh or trusted panchang.";
const DEFAULT_SOURCE_NOTE_HI = "कृपया स्थानीय संघ या विश्वसनीय पंचांग से सत्यापित करें।";

const state = {
  sampleItems: [],
  reviewItems: [],
  sources: [],
  archiveItems: [],
  mergedItems: [],
  filter: "all",
  view: "list",
  query: "",
  year: new Date().getFullYear(),
  month: new Date().getMonth() + 1,
  archiveModalIndex: -1
};

export async function initCalendarPage() {
  const root = document.getElementById("calendar-app");
  if (!root) {
    return;
  }

  const [sampleItems, reviewItems, sources, archiveItems] = await Promise.all([
    getCalendar({ limit: 300, includeDrafts: true }),
    readLocalArray("/data/review-calendar-events.json"),
    readLocalArray("/data/calendar-sources.json"),
    readLocalArray("/data/panchang-2026.json")
  ]);

  state.sampleItems = Array.isArray(sampleItems) ? sampleItems : [];
  state.reviewItems = Array.isArray(reviewItems) ? reviewItems : [];
  state.sources = Array.isArray(sources) ? sources : [];
  state.archiveItems = Array.isArray(archiveItems) ? archiveItems : [];
  state.mergedItems = mergeCalendarItems(state.sampleItems, state.reviewItems, state.sources);

  renderCalendarPage(root);

  window.addEventListener("jainworld:language-change", () => {
    renderCalendarPage(root);
  });
}

async function readLocalArray(filePath) {
  try {
    const response = await fetch(filePath);
    if (!response.ok) {
      return [];
    }
    const data = await response.json();
    return Array.isArray(data) ? data : [];
  } catch (error) {
    console.warn(`Could not load ${filePath}`, error);
    return [];
  }
}

function mergeCalendarItems(sampleItems, reviewItems, sources) {
  const sourceMap = new Map(
    sources
      .map((source) => [String(source.source_name || "").trim().toLowerCase(), source])
      .filter(([key]) => key)
  );

  return [...sampleItems, ...reviewItems]
    .map((item) => enrichCalendarItem(item, sourceMap))
    .sort((left, right) => {
      const leftDate = left.date_gregorian || "9999-99-99";
      const rightDate = right.date_gregorian || "9999-99-99";
      if (leftDate !== rightDate) {
        return leftDate.localeCompare(rightDate);
      }
      return String(left.title || left.slug || "").localeCompare(String(right.title || right.slug || ""));
    });
}

function enrichCalendarItem(item, sourceMap) {
  const next = { ...item };
  const sourceName = String(next.source_name || "").trim().toLowerCase();
  const source = sourceMap.get(sourceName) || null;

  next.event_type = next.event_type || next.type || "learning";
  next.source_type = source?.source_type || next.source_type || "manual_review";
  next.source_trust_level = source?.trust_level || "needs_review";
  next.source_location = source?.location || next.location_scope || "needs_review";
  next.review_status = next.review_status || "pending_review";
  next.date_confidence = next.date_confidence || "needs_review";
  next.tags = Array.isArray(next.tags) ? next.tags : [];
  next.caution_note = next.caution_note || DEFAULT_CAUTION_EN;
  next.caution_note_hi = next.caution_note_hi || DEFAULT_CAUTION_HI;
  next.source_note = next.source_note || DEFAULT_SOURCE_NOTE_EN;
  next.source_note_hi = next.source_note_hi || DEFAULT_SOURCE_NOTE_HI;

  return next;
}

function renderCalendarPage(root) {
  const lang = getLanguage();
  const filteredItems = getFilteredItems();
  const featuredItems = getImportantFestivalItems();

  root.innerHTML = `
    <section class="calendar-trust-notice">
      <div>
        <span class="jw-kicker">${translate("jain_calendar_and_panchang", "Jain Calendar and Panchang")}</span>
        <h2>${translate("dates_may_vary", "Dates may vary")}</h2>
        <p>${escapeHtml(getTrustNotice(lang))}</p>
      </div>
      <div class="calendar-source-note">
        <strong>${translate("verify_with_local_sangh", "Verify with local sangh")}</strong>
        <p>${escapeHtml(getVerificationSupport(lang))}</p>
      </div>
    </section>

    <section class="calendar-controls jw-card p-5">
      <div class="calendar-controls__row">
        <label class="jw-search-shell">
          <span class="jw-kicker">${translate("year", "Year")}</span>
          <select id="calendar-year-select">
            ${buildYearOptions().join("")}
          </select>
        </label>
        <label class="jw-search-shell">
          <span class="jw-kicker">${translate("month", "Month")}</span>
          <select id="calendar-month-select">
            ${MONTHS.map((month) => `<option value="${month.value}" ${month.value === state.month ? "selected" : ""}>${escapeHtml(
              lang === "hi" ? month.hi : month.en
            )}</option>`).join("")}
          </select>
        </label>
        <label class="jw-search-shell calendar-controls__search">
          <span class="jw-kicker">${translate("search", "Search")}</span>
          <input
            id="calendar-search-input"
            type="search"
            value="${escapeHtml(state.query)}"
            placeholder="${escapeHtml(
              lang === "hi" ? "पर्व, व्रत या तिथि खोजें" : "Search festivals, vrat, or tithi"
            )}"
          />
        </label>
      </div>
      <div class="calendar-controls__row">
        <div class="jw-inline-scroll">
          ${FILTERS.map((filter) => renderFilterButton(filter)).join("")}
        </div>
        <div class="calendar-view-toggle" role="tablist" aria-label="${escapeHtml(
          lang === "hi" ? "दृश्य बदलें" : "Change calendar view"
        )}">
          <button type="button" class="${state.view === "month" ? "is-active" : ""}" data-calendar-view="month">
            ${translate("month_view", "Month view")}
          </button>
          <button type="button" class="${state.view === "list" ? "is-active" : ""}" data-calendar-view="list">
            ${translate("list_view", "List view")}
          </button>
        </div>
      </div>
    </section>

    <section class="calendar-pro-panel">
      ${state.view === "month" ? renderMonthView(filteredItems, lang) : renderListView(filteredItems, lang)}
    </section>

    <section class="detail-section">
      <div class="jw-section-title">
        <div>
          <span class="jw-kicker">${translate("festivals", "Festivals")}</span>
          <h2 class="mt-3 text-2xl font-semibold tracking-tight text-stone-900">${translate(
            "festival_learning",
            "Festival Learning"
          )}</h2>
        </div>
      </div>
      <div class="related-grid">
        ${featuredItems.map((item) => renderImportantFestivalCard(item, lang)).join("")}
      </div>
    </section>

    ${renderArchiveSection(lang)}

    <section class="detail-section">
      <div class="jw-section-title">
        <div>
          <span class="jw-kicker">${translate("educational_overview", "Educational overview")}</span>
          <h2 class="mt-3 text-2xl font-semibold tracking-tight text-stone-900">${translate(
            "jain_calendar_and_panchang",
            "Jain Calendar and Panchang"
          )}</h2>
        </div>
      </div>
      <div class="jw-grid-2">
        ${renderEducationBlock(
          translate("festival_learning", "Festival overview"),
          lang === "hi"
            ? "पर्व कार्ड सामान्य जानकारी के लिए हैं। सटीक तिथि केवल तब दिखाई जाती है जब स्रोत और स्थानीय संदर्भ की समीक्षा हो।"
            : "Festival cards are for general learning first. Exact dates appear only when source and local context have been reviewed."
        )}
        ${renderEducationBlock(
          translate("tithi_vrat", "Tithi / Vrat"),
          lang === "hi"
            ? "तिथि, व्रत, एकादशी, द्वादशी और चौदस का पालन पंचांग और स्थानीय परंपरा के अनुसार भिन्न हो सकता है।"
            : "Tithi, vrat, Ekadashi, Dwadashi, and Chaudas observance can vary by panchang and local tradition."
        )}
        ${renderEducationBlock(
          translate("ayambil", "Ayambil"),
          lang === "hi"
            ? "आयंबिल के पालन में परिवार, परंपरा और स्थानीय मार्गदर्शन का महत्व रहता है।"
            : "Ayambil observance often depends on family practice, tradition, and local guidance."
        )}
        ${renderEducationBlock(
          translate("verify_with_local_sangh", "Verify with local sangh"),
          lang === "hi"
            ? "धार्मिक निर्णय, उपवास, यात्रा, या विशेष कार्यक्रम के लिए स्थानीय संघ या विश्वसनीय पंचांग से पुष्टि करें।"
            : "For religious decisions, fasting, travel, or special programmes, confirm with your local sangh or a trusted panchang."
        )}
      </div>
    </section>

    ${renderArchiveModal(lang)}
  `;

  bindCalendarEvents(root);
  updateLanguageDOM(lang);
}

function renderMonthView(items, lang) {
  const days = buildMonthGrid(state.year, state.month, items);
  const monthLabel = MONTHS[state.month - 1] || MONTHS[0];
  const monthTitle = `${lang === "hi" ? monthLabel.hi : monthLabel.en} ${state.year}`;
  const monthItems = items.filter((item) => matchesGregorianMonth(item, state.year, state.month));

  return `
    <div class="detail-section">
      <div class="jw-section-title">
        <div>
          <span class="jw-kicker">${translate("month_view", "Month view")}</span>
          <h2 class="mt-3 text-2xl font-semibold tracking-tight text-stone-900">${escapeHtml(monthTitle)}</h2>
        </div>
        <span class="jw-badge">${monthItems.length}</span>
      </div>
      <div class="calendar-month-grid calendar-month-grid--weekdays">
        ${WEEKDAYS.map((day) => `<div class="calendar-day-cell calendar-day-cell--weekday">${escapeHtml(lang === "hi" ? day.hi : day.en)}</div>`).join("")}
      </div>
      <div class="calendar-month-grid">
        ${days.map((day) => renderDayCell(day, lang)).join("")}
      </div>
      ${
        monthItems.length
          ? `<div class="calendar-list calendar-list--compact mt-4">${monthItems.map((item) => renderCompactEventCard(item, lang)).join("")}</div>`
          : `<div class="calendar-empty-state mt-4">${escapeHtml(
              lang === "hi"
                ? "इस महीने के लिए अभी कोई सत्यापित या स्रोत-आधारित तिथि उपलब्ध नहीं है।"
                : "No verified or source-based dates are available for this month yet."
            )}</div>`
      }
    </div>
  `;
}

function renderListView(items, lang) {
  if (!items.length) {
    return `<div class="calendar-empty-state">${translate("no_calendar_records_found", "No calendar records found")}</div>`;
  }

  return `<div class="calendar-list">${items.map((item) => renderEventCard(item, lang)).join("")}</div>`;
}

function renderDayCell(day, lang) {
  const classes = ["calendar-day-cell"];
  if (!day.isCurrentMonth) {
    classes.push("calendar-day-cell--muted");
  }
  if (day.isToday) {
    classes.push("calendar-day-cell--today");
  }

  return `
    <article class="${classes.join(" ")}">
      <div class="calendar-day-number">${day.dayNumber || ""}</div>
      <div class="calendar-day-events">
        ${day.items
          .slice(0, 3)
          .map((item) => {
            const confidenceClass = getConfidenceClass(item.date_confidence);
            return `
              <span class="calendar-event-chip ${confidenceClass}">
                <span class="calendar-event-dot" aria-hidden="true"></span>
                ${escapeHtml(shortTitle(item, lang))}
                ${String(item.date_confidence || "").toLowerCase() === "needs_review" ? '<span aria-hidden="true">!</span>' : ""}
              </span>
            `;
          })
          .join("")}
      </div>
    </article>
  `;
}

function renderCompactEventCard(item, lang) {
  return `
    <article class="calendar-event-card">
      <div class="flex flex-wrap items-center gap-2">
        <span class="jw-badge">${escapeHtml(eventTypeLabel(item.event_type))}</span>
        ${renderConfidenceBadge(item.date_confidence)}
      </div>
      <h3>${escapeHtml(localizedTitle(item, lang))}</h3>
      <p>${escapeHtml(localizedDateDisplay(item, lang))}</p>
    </article>
  `;
}

function renderEventCard(item, lang) {
  const title = localizedTitle(item, lang);
  const summary = localizedSummary(item, lang);
  const sourceNote = pickLocalized(item, "source_note", lang) || item.source_note || "";
  const cautionNote = pickLocalized(item, "caution_note", lang) || item.caution_note || "";
  const sourceLine = item.source_name
    ? `${translate("source", "Source")}: ${item.source_name}`
    : translate("source_details_are_being_reviewed", "Source details are being reviewed.");
  const dateLine = localizedDateDisplay(item, lang);
  const lunarMonth = lang === "hi" ? item.lunar_month_hi || item.lunar_month : item.lunar_month || item.lunar_month_hi;
  const lunarTithi = lang === "hi" ? item.lunar_tithi_hi || item.lunar_tithi : item.lunar_tithi || item.lunar_tithi_hi;
  const monthName = lang === "hi" ? item.month_hi || item.month : item.month || item.month_hi;

  return `
    <article class="calendar-event-card">
      <div class="flex flex-wrap items-center gap-2">
        <span class="jw-badge">${escapeHtml(eventTypeLabel(item.event_type))}</span>
        ${renderConfidenceBadge(item.date_confidence)}
      </div>
      <h3>${escapeHtml(title)}</h3>
      <p>${escapeHtml(summary)}</p>
      <div class="jw-meta mt-3">
        <span>${escapeHtml(dateLine)}</span>
        ${lunarTithi ? `<span>${translate("lunar_tithi", "Lunar tithi")}: ${escapeHtml(lunarTithi)}</span>` : ""}
        ${lunarMonth ? `<span>${translate("lunar_month", "Lunar month")}: ${escapeHtml(lunarMonth)}</span>` : ""}
        ${monthName ? `<span>${translate("month", "Month")}: ${escapeHtml(monthName)}</span>` : ""}
      </div>
      <div class="calendar-source-note">
        <strong>${escapeHtml(sourceLine)}</strong>
        <p>${escapeHtml(sourceNote)}</p>
      </div>
      <div class="jw-meta mt-3">
        <span>${translate("tradition_scope", "Tradition scope")}: ${escapeHtml(scopeLabel(item.tradition_scope))}</span>
        <span>${translate("location_scope", "Location scope")}: ${escapeHtml(scopeLabel(item.location_scope))}</span>
      </div>
      <p class="calendar-source-note"><strong>${translate("verify_with_local_sangh", "Verify with local sangh")}:</strong> ${escapeHtml(cautionNote)}</p>
      <div class="detail-cta">
        <a class="jw-btn jw-btn-secondary" href="${escapeHtml(buildVerificationLink(item, lang))}">
          ${translate("verify_with_local_sangh", "Verify with local sangh")}
        </a>
        <a class="jw-btn" href="/corrections.html?topic=calendar">
          ${translate("report_calendar_correction", "Report calendar correction")}
        </a>
      </div>
    </article>
  `;
}

function renderImportantFestivalCard(item, lang) {
  return `
    <article class="calendar-event-card">
      <div class="flex flex-wrap items-center gap-2">
        <span class="jw-badge">${escapeHtml(eventTypeLabel(item.event_type))}</span>
        ${renderConfidenceBadge(item.date_confidence)}
      </div>
      <h3>${escapeHtml(localizedTitle(item, lang))}</h3>
      <p>${escapeHtml(localizedSummary(item, lang))}</p>
      <p class="calendar-source-note">${escapeHtml(localizedDateDisplay(item, lang))}</p>
    </article>
  `;
}

function renderEducationBlock(title, body) {
  return `
    <article class="calendar-event-card">
      <h3>${escapeHtml(title)}</h3>
      <p>${escapeHtml(body)}</p>
    </article>
  `;
}

function renderArchiveSection(lang) {
  const monthRecords = state.archiveItems.filter((item) => item.asset_type !== "pdf");
  const backPage = state.archiveItems.find((item) => item.asset_type === "pdf");

  return `
    <section class="detail-section">
      <div class="jw-section-title">
        <div>
          <span class="jw-kicker">${translate("panchang_archive", "Panchang Archive")}</span>
          <h2 class="mt-3 text-2xl font-semibold tracking-tight text-stone-900">${translate(
            "jain_panchang_source_archive",
            "Jain Panchang Source Archive"
          )}</h2>
        </div>
      </div>
      <p class="m-0 mb-4 text-sm leading-7 text-stone-600">
        ${escapeHtml(
          lang === "hi"
            ? "Tirthankar Vardhman Jain Panchang 2026 के मासिक पृष्ठ यहाँ स्रोत संदर्भ के रूप में दिखाए जाते हैं। महत्वपूर्ण पालन के लिए अभी भी स्थानीय संघ या विश्वसनीय पंचांग से पुष्टि करें।"
            : "View month-wise pages from Tirthankar Vardhman Jain Panchang 2026. These scans are shown as source reference. Important observances should still be verified with your local sangh or trusted panchang."
        )}
      </p>
      <div class="panchang-archive-grid">
        ${monthRecords.map((item, index) => renderArchiveCard(item, index, lang)).join("")}
      </div>
      ${
        backPage
          ? `<div class="calendar-source-note mt-4">
              <strong>${translate("source_provided_reference", "Source-provided reference")}</strong>
              <p>${escapeHtml(backPage.credit_text || backPage.notes || "")}</p>
              <div class="detail-cta">
                <a class="jw-btn jw-btn-secondary ${backPage.pdf_url ? "" : "is-disabled"}" ${
                  backPage.pdf_url ? `href="${escapeHtml(backPage.pdf_url)}" target="_blank" rel="noopener noreferrer"` : 'href="#" aria-disabled="true"'
                }>
                  ${translate("open_panchang_back_pages", "Open Panchang Back Pages")}
                </a>
                <a class="jw-btn" href="/corrections.html?topic=panchang">
                  ${translate("report_calendar_correction", "Report calendar correction")}
                </a>
              </div>
            </div>`
          : ""
      }
    </section>
  `;
}

function renderArchiveCard(item, index, lang) {
  const imageUrl = item.image_url || "";
  const expectedPath = item.expected_image_url || "";
  const title = pickLocalized(item, "title", lang) || item.title || "";
  const sourceBadge = translate("source_provided_reference", "Source-provided reference");
  const permissionBadge = translate("permission_review_needed", "Permission review needed");
  const verifyBadge = translate("verify_with_local_sangh", "Verify with local sangh");

  return `
    <article class="panchang-archive-card">
      <div class="panchang-archive-thumb">
        ${
          imageUrl
            ? `<img src="${escapeHtml(imageUrl)}" alt="${escapeHtml(title)}" loading="lazy" />`
            : `<div class="panchang-archive-thumb__placeholder">
                <span>${escapeHtml(lang === "hi" ? item.month_name_hi || "" : item.month_name || "")}</span>
                <small>${escapeHtml(
                  lang === "hi"
                    ? "स्कैन फ़ाइल की स्थानीय प्रति लंबित"
                    : "Scan file local copy pending"
                )}</small>
              </div>`
        }
      </div>
      <div class="panchang-archive-body">
        <div class="flex flex-wrap gap-2">
          <span class="calendar-confidence-badge calendar-confidence--source">${escapeHtml(sourceBadge)}</span>
          <span class="calendar-confidence-badge calendar-confidence--review">${escapeHtml(permissionBadge)}</span>
          <span class="calendar-confidence-badge calendar-confidence--educational">${escapeHtml(verifyBadge)}</span>
        </div>
        <h3>${escapeHtml(title)}</h3>
        <p>${escapeHtml(pickLocalized(item, "notes", lang) || item.notes || "")}</p>
        <div class="detail-cta">
          <button type="button" class="jw-btn jw-btn-secondary" data-panchang-open="${index}">
            ${translate("view_panchang_page", "View Panchang Page")}
          </button>
          <a class="jw-btn ${imageUrl ? "" : "is-disabled"}" ${
            imageUrl ? `href="${escapeHtml(imageUrl)}" target="_blank" rel="noopener noreferrer"` : 'href="#" aria-disabled="true"'
          }>
            ${translate("open_full_image", "Open full image")}
          </a>
          <a class="jw-btn" href="/corrections.html?topic=panchang&month=${encodeURIComponent(item.month_name || item.month_name_hi || "")}">
            ${translate("report_calendar_correction", "Report calendar correction")}
          </a>
        </div>
        <div class="calendar-source-note">
          <strong>${escapeHtml(item.source_name || "Tirthankar Vardhman Jain Panchang 2026")}</strong>
          <p>${escapeHtml(item.credit_text || "")}</p>
          ${expectedPath && !imageUrl ? `<p class="m-0 text-xs text-stone-500">${escapeHtml(expectedPath)}</p>` : ""}
        </div>
      </div>
    </article>
  `;
}

function renderArchiveModal(lang) {
  const activeItem = state.archiveItems.filter((item) => item.asset_type !== "pdf")[state.archiveModalIndex] || null;
  const isOpen = Boolean(activeItem);
  const imageUrl = activeItem?.image_url || "";
  const sourceUrl = activeItem?.source_url || "";
  const expectedPath = activeItem?.expected_image_url || "";
  const title = activeItem ? pickLocalized(activeItem, "title", lang) || activeItem.title || "" : "";

  return `
    <div class="panchang-archive-modal ${isOpen ? "is-open" : ""}" id="panchang-archive-modal" aria-hidden="${isOpen ? "false" : "true"}">
      <div class="panchang-archive-modal__backdrop" data-panchang-close="true"></div>
      <div class="panchang-archive-modal__dialog" role="dialog" aria-modal="true" aria-label="${escapeHtml(title || translate("panchang_archive", "Panchang Archive"))}">
        <div class="panchang-archive-modal__header">
          <div>
            <span class="jw-kicker">${translate("panchang_archive", "Panchang Archive")}</span>
            <h2>${escapeHtml(title || translate("jain_panchang_source_archive", "Jain Panchang Source Archive"))}</h2>
          </div>
          <button type="button" class="jw-btn" data-panchang-close="true">Close</button>
        </div>
        <div class="panchang-archive-modal__content">
          ${
            activeItem
              ? imageUrl
                ? `<img class="panchang-archive-modal__image" src="${escapeHtml(imageUrl)}" alt="${escapeHtml(title)}" />`
                : `<div class="panchang-archive-modal__missing">
                    <strong>${escapeHtml(lang === "hi" ? "स्थानीय फ़ाइल की प्रतीक्षा" : "Waiting for local file copy")}</strong>
                    <p>${escapeHtml(
                      lang === "hi"
                        ? "स्कैन संरचना तैयार है, लेकिन वास्तविक छवि फ़ाइल अभी इस प्रोजेक्ट में कॉपी नहीं की गई है।"
                        : "The archive structure is ready, but the real scan file has not been copied into this project yet."
                    )}</p>
                    ${expectedPath ? `<p class="jw-mono">${escapeHtml(expectedPath)}</p>` : ""}
                  </div>`
              : ""
          }
          ${
            activeItem
              ? `<div class="calendar-source-note">
                  <strong>${escapeHtml(activeItem.source_name || "")}</strong>
                  <p>${escapeHtml(activeItem.credit_text || "")}</p>
                  <p>${escapeHtml(pickLocalized(activeItem, "notes", lang) || activeItem.notes || "")}</p>
                </div>`
              : ""
          }
        </div>
        <div class="panchang-archive-modal__footer">
          <button type="button" class="jw-btn jw-btn-secondary" data-panchang-nav="prev">${translate("previous", "Previous")}</button>
          <button type="button" class="jw-btn jw-btn-secondary" data-panchang-nav="next">${translate("next", "Next")}</button>
          <a class="jw-btn ${sourceUrl ? "" : "is-disabled"}" ${
            sourceUrl ? `href="${escapeHtml(sourceUrl)}" target="_blank" rel="noopener noreferrer"` : 'href="#" aria-disabled="true"'
          }>
            ${translate("open_original_source", "Open Original Source")}
          </a>
        </div>
      </div>
    </div>
  `;
}

function renderFilterButton(filter) {
  const isActive = state.filter === filter.key;
  return `
    <button type="button" class="prayer-chip ${isActive ? "is-active" : ""}" data-calendar-filter="${filter.key}">
      ${escapeHtml(translate(filter.translation, filter.fallback))}
    </button>
  `;
}

function bindCalendarEvents(root) {
  root.querySelectorAll("[data-calendar-filter]").forEach((button) => {
    button.addEventListener("click", () => {
      state.filter = button.getAttribute("data-calendar-filter") || "all";
      renderCalendarPage(root);
    });
  });

  root.querySelectorAll("[data-calendar-view]").forEach((button) => {
    button.addEventListener("click", () => {
      state.view = button.getAttribute("data-calendar-view") || "list";
      renderCalendarPage(root);
    });
  });

  root.querySelector("#calendar-year-select")?.addEventListener("change", (event) => {
    state.year = Number(event.target.value) || new Date().getFullYear();
    renderCalendarPage(root);
  });

  root.querySelector("#calendar-month-select")?.addEventListener("change", (event) => {
    state.month = Number(event.target.value) || new Date().getMonth() + 1;
    renderCalendarPage(root);
  });

  root.querySelector("#calendar-search-input")?.addEventListener("input", (event) => {
    state.query = String(event.target.value || "").trim();
    renderCalendarPage(root);
  });

  root.querySelectorAll("[data-panchang-open]").forEach((button) => {
    button.addEventListener("click", () => {
      state.archiveModalIndex = Number(button.getAttribute("data-panchang-open"));
      renderCalendarPage(root);
    });
  });

  root.querySelectorAll("[data-panchang-close]").forEach((element) => {
    element.addEventListener("click", () => {
      state.archiveModalIndex = -1;
      renderCalendarPage(root);
    });
  });

  root.querySelectorAll("[data-panchang-nav]").forEach((button) => {
    button.addEventListener("click", () => {
      moveArchiveModal(button.getAttribute("data-panchang-nav"));
      renderCalendarPage(root);
    });
  });

  bindEscapeClose(root);
}

let escapeBound = false;

function bindEscapeClose(root) {
  if (escapeBound) {
    return;
  }

  escapeBound = true;
  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && state.archiveModalIndex >= 0) {
      state.archiveModalIndex = -1;
      renderCalendarPage(root);
    }
  });
}

function moveArchiveModal(direction) {
  const items = state.archiveItems.filter((item) => item.asset_type !== "pdf");
  if (!items.length || state.archiveModalIndex < 0) {
    return;
  }
  if (direction === "prev") {
    state.archiveModalIndex = (state.archiveModalIndex - 1 + items.length) % items.length;
    return;
  }
  state.archiveModalIndex = (state.archiveModalIndex + 1) % items.length;
}

function getFilteredItems() {
  return state.mergedItems.filter((item) => {
    if (!matchesFilter(item)) {
      return false;
    }

    if (state.query) {
      const haystack = [
        item.title,
        item.title_hi,
        item.summary,
        item.summary_hi,
        item.lunar_tithi,
        item.lunar_tithi_hi,
        item.lunar_month,
        item.lunar_month_hi,
        Array.isArray(item.tags) ? item.tags.join(" ") : ""
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      if (!haystack.includes(state.query.toLowerCase())) {
        return false;
      }
    }

    return true;
  });
}

function matchesFilter(item) {
  const type = String(item.event_type || "").toLowerCase();
  const confidence = String(item.date_confidence || "").toLowerCase();
  const tithi = String(item.lunar_tithi || "").toLowerCase();

  switch (state.filter) {
    case "festival":
      return type === "festival" || type === "local_event";
    case "tithi_vrat":
      return ["tithi", "vrat", "ekadashi", "dwadashi", "chaudas"].includes(type);
    case "ayambil":
      return type === "ayambil";
    case "ekadashi":
      return type === "ekadashi" || tithi.includes("ekadashi");
    case "dwadashi":
      return type === "dwadashi" || tithi.includes("dwadashi");
    case "chaudas":
      return type === "chaudas" || tithi.includes("chaudas") || tithi.includes("chaudash");
    case "learning":
      return confidence === "educational_only" || type === "learning";
    case "needs_review":
      return confidence === "needs_review" || String(item.review_status || "").toLowerCase() === "pending_review";
    default:
      return true;
  }
}

function buildMonthGrid(year, month, items) {
  const firstDay = new Date(year, month - 1, 1);
  const lastDay = new Date(year, month, 0);
  const startWeekday = firstDay.getDay();
  const totalDays = lastDay.getDate();
  const today = new Date();
  const cells = [];

  for (let index = 0; index < startWeekday; index += 1) {
    cells.push({ dayNumber: "", items: [], isCurrentMonth: false, isToday: false });
  }

  for (let day = 1; day <= totalDays; day += 1) {
    const isoDate = `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    cells.push({
      dayNumber: day,
      items: items.filter((item) => item.date_gregorian === isoDate),
      isCurrentMonth: true,
      isToday:
        year === today.getFullYear() &&
        month === today.getMonth() + 1 &&
        day === today.getDate()
    });
  }

  while (cells.length % 7 !== 0) {
    cells.push({ dayNumber: "", items: [], isCurrentMonth: false, isToday: false });
  }

  return cells;
}

function getImportantFestivalItems() {
  const seen = new Set();
  return state.mergedItems.filter((item) => {
    const normalized = String(item.title || "").toLowerCase();
    const matched = IMPORTANT_FESTIVAL_KEYS.some((key) => normalized.includes(key));
    if (!matched) {
      return false;
    }

    const dedupeKey = IMPORTANT_FESTIVAL_KEYS.find((key) => normalized.includes(key));
    if (seen.has(dedupeKey)) {
      return false;
    }

    seen.add(dedupeKey);
    return true;
  });
}

function buildYearOptions() {
  const years = new Set([new Date().getFullYear()]);

  state.mergedItems.forEach((item) => {
    if (item.year) {
      years.add(Number(item.year));
    } else if (item.date_gregorian) {
      years.add(Number(String(item.date_gregorian).slice(0, 4)));
    }
  });

  state.archiveItems.forEach((item) => {
    if (item.year) {
      years.add(Number(item.year));
    }
  });

  return [...years]
    .filter((year) => Number.isFinite(year))
    .sort((left, right) => left - right)
    .map((year) => `<option value="${year}" ${year === state.year ? "selected" : ""}>${year}</option>`);
}

function localizedTitle(item, lang) {
  return pickLocalized(item, "title", lang) || item.title || translate("jain_calendar_and_panchang", "Jain Calendar and Panchang");
}

function localizedSummary(item, lang) {
  return pickLocalized(item, "summary", lang) || item.summary || translate("educational_overview", "Educational overview");
}

function localizedDateDisplay(item, lang) {
  if (String(item.date_confidence || "").toLowerCase() === "educational_only") {
    return translate("educational_overview", "Educational overview");
  }

  const display = lang === "hi" ? item.date_display_hi || item.date_display : item.date_display || item.date_display_hi;
  return display || translate("date_needs_review", "Date needs review");
}

function shortTitle(item, lang) {
  const title = localizedTitle(item, lang);
  return title.length > 24 ? `${title.slice(0, 21)}...` : title;
}

function eventTypeLabel(type) {
  const key = String(type || "learning");
  return translateLabel(key, translate(key.replace(/\s+/g, "_"), key));
}

function scopeLabel(value) {
  return translateLabel(value || "", value || translate("not_available_yet", "Not available yet"));
}

function renderConfidenceBadge(confidence) {
  const key = String(confidence || "needs_review").toLowerCase();
  const className = getConfidenceClass(key);

  if (key === "verified") {
    return `<span class="calendar-confidence-badge ${className}">${translate("verified_date", "Verified date")}</span>`;
  }
  if (key === "source_provided") {
    return `<span class="calendar-confidence-badge ${className}">${translate("source_provided", "Source provided")}</span>`;
  }
  if (key === "educational_only") {
    return `<span class="calendar-confidence-badge ${className}">${translate("educational_overview", "Educational overview")}</span>`;
  }
  return `<span class="calendar-confidence-badge ${className}">${translate("date_needs_review", "Date needs review")}</span>`;
}

function getConfidenceClass(confidence) {
  const key = String(confidence || "needs_review").toLowerCase();
  if (key === "verified") {
    return "calendar-confidence--verified";
  }
  if (key === "source_provided") {
    return "calendar-confidence--source";
  }
  if (key === "educational_only") {
    return "calendar-confidence--educational";
  }
  return "calendar-confidence--review";
}

function matchesGregorianMonth(item, year, month) {
  if (!item.date_gregorian) {
    return false;
  }
  const [itemYear, itemMonth] = String(item.date_gregorian).split("-").map(Number);
  return itemYear === year && itemMonth === month;
}

function buildVerificationLink(item, lang) {
  const query = lang === "hi" ? `${item.title_hi || item.title} तिथि सत्यापन` : `${item.title} date verification`;
  return `/search.html?q=${encodeURIComponent(query)}`;
}

function getTrustNotice(lang) {
  if (lang === "hi") {
    return "जैन तिथियाँ पंचांग, स्थान, परंपरा और स्थानीय संघ की परंपरा के अनुसार भिन्न हो सकती हैं। महत्वपूर्ण पालन के लिए कृपया अपने स्थानीय संघ या विश्वसनीय पंचांग से सत्यापित करें।";
  }
  return "Dates can vary by panchang, location, tradition, and local sangh. Please verify important observances with your local sangh or trusted panchang.";
}

function getVerificationSupport(lang) {
  if (lang === "hi") {
    return "JainWorld शैक्षणिक पर्व जानकारी और समीक्षा-आधारित तिथि प्रविष्टियों को अलग रखता है। किसी भी धार्मिक निर्णय से पहले स्थानीय पुष्टि करें।";
  }
  return "JainWorld separates educational festival guidance from reviewed date records. Confirm locally before making any religious decision.";
}

function escapeHtml(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

initCalendarPage();
