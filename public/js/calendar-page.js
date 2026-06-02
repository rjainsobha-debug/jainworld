import { getLanguage, pickLocalized, translate, updateLanguageDOM } from "./language.js";

const YEAR_OPTIONS = [2026];
const MONTHS = [
  { value: 1, en: "January", hi: "जनवरी", slug: "january" },
  { value: 2, en: "February", hi: "फरवरी", slug: "february" },
  { value: 3, en: "March", hi: "मार्च", slug: "march" },
  { value: 4, en: "April", hi: "अप्रैल", slug: "april" },
  { value: 5, en: "May", hi: "मई", slug: "may" },
  { value: 6, en: "June", hi: "जून", slug: "june" },
  { value: 7, en: "July", hi: "जुलाई", slug: "july" },
  { value: 8, en: "August", hi: "अगस्त", slug: "august" },
  { value: 9, en: "September", hi: "सितंबर", slug: "september" },
  { value: 10, en: "October", hi: "अक्टूबर", slug: "october" },
  { value: 11, en: "November", hi: "नवंबर", slug: "november" },
  { value: 12, en: "December", hi: "दिसंबर", slug: "december" }
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
  { key: "all", label: "All", labelHi: "सभी" },
  { key: "festival", label: "Festivals", labelHi: "पर्व" },
  { key: "tithi_vrat", label: "Tithi / Vrat", labelHi: "तिथि / व्रत" },
  { key: "ayambil", label: "Ayambil", labelHi: "आयंबिल" },
  { key: "ekadashi", label: "Ekadashi", labelHi: "एकादशी" },
  { key: "dwadashi", label: "Dwadashi", labelHi: "द्वादशी" },
  { key: "chaudas", label: "Chaudas", labelHi: "चौदस" },
  { key: "learning", label: "Learning", labelHi: "शिक्षा" },
  { key: "needs_review", label: "Needs Review", labelHi: "समीक्षा आवश्यक" }
];

const DETAIL_TABS = [
  { key: "day", label: "Day details", labelHi: "दिन विवरण" },
  { key: "muhurat", label: "Muhurat", labelHi: "मुहूर्त" },
  { key: "nakshatra", label: "Nakshatra", labelHi: "नक्षत्र" },
  { key: "hora", label: "Hora", labelHi: "होरा" },
  { key: "source", label: "Source", labelHi: "स्रोत" }
];

const DEFAULT_CAUTION_EN = "Dates may vary by panchang, location, tradition, and local sangh verification.";
const DEFAULT_CAUTION_HI = "तिथियाँ पंचांग, स्थान, परंपरा और स्थानीय संघ सत्यापन के अनुसार भिन्न हो सकती हैं।";
const DEFAULT_SOURCE_NOTE_EN = "Please verify with local sangh or a trusted panchang.";
const DEFAULT_SOURCE_NOTE_HI = "कृपया स्थानीय संघ या विश्वसनीय पंचांग से सत्यापित करें।";

const state = {
  year: 2026,
  month: 6,
  view: "month",
  filter: "all",
  query: "",
  activeTab: "day",
  digital: null,
  archive: [],
  overview: [],
  reviewEvents: [],
  sources: [],
  manualQueue: [],
  ocrQueue: [],
  archiveImageIndex: -1,
  selectedDayKey: null
};

initCalendarPage();

async function initCalendarPage() {
  const root = document.getElementById("calendar-app");
  if (!root) {
    return;
  }

  const [digital, archive, overview, reviewEvents, sources, manualQueue, ocrQueue] = await Promise.all([
    readJson("/data/panchang-digital-2026.json"),
    readJson("/data/panchang-2026.json"),
    readJson("/data/sample-calendar.json"),
    readJson("/data/review-calendar-events.json"),
    readJson("/data/calendar-sources.json"),
    readJson("/data/review-panchang-manual-extraction.json"),
    readJson("/data/review-panchang-ocr-extraction.json")
  ]);

  state.digital = normalizeDigital(digital);
  state.archive = Array.isArray(archive) ? archive : [];
  state.overview = [...toArray(overview), ...toArray(reviewEvents)];
  state.reviewEvents = toArray(reviewEvents);
  state.sources = toArray(sources);
  state.manualQueue = toArray(manualQueue);
  state.ocrQueue = toArray(ocrQueue);
  const initial = getInitialSelectionFromQuery();
  state.month = initial.month || pickInitialMonth(state.digital);
  state.selectedDayKey = initial.date || getInitialSelectedDayKey(state.digital, state.month);

  renderCalendarPage(root);
  wireEvents(root);

  if (!window.__jainworldPanchangKeydownBound) {
    window.__jainworldPanchangKeydownBound = true;
    document.addEventListener("keydown", handleDocumentKeydown);
  }

  window.addEventListener("jainworld:language-change", () => {
    renderCalendarPage(root);
    wireEvents(root);
  });
}

async function readJson(filePath) {
  try {
    const response = await fetch(filePath);
    if (!response.ok) {
      return null;
    }
    return response.json();
  } catch (error) {
    console.warn(`Could not load ${filePath}`, error);
    return null;
  }
}

function normalizeDigital(digital) {
  if (!digital || typeof digital !== "object") {
    return { months: [] };
  }

  const months = Array.isArray(digital.months) ? digital.months.map((month) => normalizeMonth(month)) : [];
  return { ...digital, months };
}

function normalizeMonth(month) {
  const monthNumber = Number(month.month_number || month.number || 0);
  const sourceImage = month.source_image || month.image_url || `/assets/calendar/panchang-2026/${getMonthSlug(monthNumber)}-2026.jpg`;
  const sourcePdf = month.source_pdf || month.pdf_url || "/assets/calendar/panchang-2026/panchang-back-page-2026.pdf";
  const days = Array.isArray(month.days) ? month.days.map((day) => normalizeDay(day, monthNumber, sourceImage, sourcePdf)) : [];

  return {
    ...month,
    month_number: monthNumber,
    month_name: month.month_name || getMonthName(monthNumber).en,
    month_name_hi: month.month_name_hi || getMonthName(monthNumber).hi,
    month_slug: month.month_slug || getMonthSlug(monthNumber),
    source_image: sourceImage,
    source_pdf: sourcePdf,
    image_url: month.image_url || sourceImage,
    pdf_url: month.pdf_url || sourcePdf,
    days
  };
}

function normalizeDay(day, monthNumber, sourceImage, sourcePdf) {
  const date = String(day.gregorian_date || "").trim();
  const parsed = date ? new Date(`${date}T00:00:00`) : null;
  const dayNumber = Number(day.day_number || (parsed && !Number.isNaN(parsed.getTime()) ? parsed.getDate() : 0));
  const month = getMonthName(monthNumber);
  const weekday = parsed && !Number.isNaN(parsed.getTime()) ? WEEKDAYS[parsed.getDay()] : { en: "", hi: "" };
  const shortLabel = String(day.short_label || "").trim();
  const shortLabelHi = String(day.short_label_hi || "").trim();

  return {
    ...day,
    id: day.id || `panchang-digital-${date || `${monthNumber}-${dayNumber}`}`,
    gregorian_date: date || null,
    day_number: dayNumber,
    month_number: monthNumber,
    month_name: day.month_name || month.en,
    month_name_hi: day.month_name_hi || month.hi,
    weekday: day.weekday || weekday.en,
    weekday_hi: day.weekday_hi || weekday.hi,
    date_display: day.date_display || (date ? formatDateDisplay(dayNumber, month.en) : `${month.en} ${dayNumber}`),
    date_display_hi: day.date_display_hi || (date ? formatDateDisplay(dayNumber, month.hi) : `${month.hi} ${dayNumber}`),
    title: day.title || formatDayTitle(dayNumber, weekday.en, month.en),
    title_hi: day.title_hi || formatDayTitle(dayNumber, weekday.hi, month.hi),
    source_image: day.source_image || sourceImage,
    source_pdf: day.source_pdf || sourcePdf,
    source_name: day.source_name || state?.digital?.source_name || "Tirthankar Vardhman Jain Panchang 2026",
    source_url: day.source_url || state?.digital?.source_url || "https://www.onlinejainpathshala.com/",
    source_site: day.source_site || state?.digital?.source_site || "onlinejainpathshala.com",
    source_note: day.source_note || DEFAULT_SOURCE_NOTE_EN,
    source_note_hi: day.source_note_hi || DEFAULT_SOURCE_NOTE_HI,
    caution_note: day.caution_note || DEFAULT_CAUTION_EN,
    caution_note_hi: day.caution_note_hi || DEFAULT_CAUTION_HI,
    date_confidence: day.date_confidence || "needs_review",
    review_status: day.review_status || "pending_review",
    extraction_status: day.extraction_status || "pending_manual_extraction",
    event_type: day.event_type || "local_event",
    short_label: shortLabel,
    short_label_hi: shortLabelHi,
    chips: Array.isArray(day.chips) ? day.chips : [],
    muhurat: day.muhurat || {
      sunrise: null,
      sunset: null,
      navkarsi: null,
      porshi: null,
      sadha_porshi: null,
      purimaddha: null,
      avaddha: null
    },
    lunar_month: day.lunar_month || null,
    lunar_month_hi: day.lunar_month_hi || null,
    lunar_tithi: day.lunar_tithi || null,
    lunar_tithi_hi: day.lunar_tithi_hi || null,
    paksha: day.paksha || "needs_review",
    paksha_hi: day.paksha_hi || translate("needs_review", "Needs Review"),
    nakshatra: day.nakshatra || null,
    nakshatra_hi: day.nakshatra_hi || null,
    hora: day.hora || null,
    hora_hi: day.hora_hi || null,
    summary: day.summary || "",
    summary_hi: day.summary_hi || "",
    details_pending: !shortLabel && String(day.extraction_status || "").includes("pending")
  };
}

function pickInitialMonth(digital) {
  const current = new Date();
  if (digital?.year === current.getFullYear()) {
    return current.getMonth() + 1;
  }
  return 1;
}

function getInitialSelectionFromQuery() {
  try {
    const url = new URL(window.location.href);
    const dateParam = String(url.searchParams.get("date") || "").trim();
    const monthParam = Number(url.searchParams.get("month") || 0);

    if (dateParam && !Number.isNaN(new Date(`${dateParam}T00:00:00`).getTime())) {
      const date = new Date(`${dateParam}T00:00:00`);
      return {
        month: date.getMonth() + 1,
        date: toDateKey(date)
      };
    }

    if (monthParam >= 1 && monthParam <= 12) {
      return { month: monthParam, date: null };
    }
  } catch (error) {
    return { month: null, date: null };
  }

  return { month: null, date: null };
}

function getInitialSelectedDayKey(digital, monthNumber) {
  const current = new Date();
  if (digital?.year === current.getFullYear() && current.getMonth() + 1 === monthNumber) {
    return toDateKey(current);
  }

  const month = getMonthRecord(digital, monthNumber);
  return month?.days?.[0]?.gregorian_date || null;
}

function renderCalendarPage(root) {
  const lang = getLanguage();
  const month = getMonthRecord(state.digital, state.month);
  const days = getVisibleDays(month);
  const selectedDay = getSelectedDay(month);
  const sourceMonth = getSourceMonthRecord(state.archive, state.month);
  const archiveImages = state.archive.filter((item) => item.image_url);
  const backPage = state.archive.find((item) => item.asset_type === "pdf" && item.pdf_url);

  root.innerHTML = `
    <section class="digital-panchang">
      <header class="digital-panchang__header devotional-hero">
        <div class="jw-page-hero-inner jw-container">
          <div class="breadcrumb">
            <a href="/index.html">${translate("home", "Home")}</a>
            <span aria-hidden="true">/</span>
            <span>${translate("jain_calendar_and_panchang", "Jain Calendar and Panchang")}</span>
          </div>
          <span class="section-kicker">${translate("digital_jain_panchang_2026", "Digital Jain Panchang 2026")}</span>
          <h1 class="mt-4 text-4xl font-bold tracking-tight text-stone-900">
            ${translate("digital_jain_panchang_2026", "Digital Jain Panchang 2026")}
          </h1>
          <p class="m-0 mt-4 max-w-3xl text-base leading-8 text-stone-700">
            ${escapeHtml(
              lang === "hi"
                ? "दिन-वार विवरण, मुहूर्त, नक्षत्र, होरा और स्रोत पृष्ठों के साथ एक trust-first जैन पंचांग अनुभव।"
                : "A trust-first Jain Panchang experience with day details, muhurat, nakshatra, hora, and source pages."
            )}
          </p>
        </div>
      </header>

      <section class="calendar-trust-notice jw-container">
        <div>
          <h2>${translate("dates_may_vary", "Dates may vary")}</h2>
          <p>${escapeHtml(getTrustNotice(lang))}</p>
        </div>
        <div class="calendar-source-note">
          <strong>${translate("verify_with_local_sangh", "Verify with local sangh")}</strong>
          <p>${escapeHtml(
            lang === "hi"
              ? "महत्वपूर्ण धार्मिक निर्णयों के लिए स्थानीय संघ या विश्वसनीय पंचांग से सत्यापन करें।"
              : "Please verify important observances with your local sangh or a trusted panchang before making religious decisions."
          )}</p>
        </div>
      </section>

      <section class="calendar-controls jw-container jw-card">
        <div class="calendar-controls__row">
          <label class="jw-search-shell">
            <span class="jw-kicker">${translate("year", "Year")}</span>
            <select id="calendar-year-select">
              ${YEAR_OPTIONS.map((year) => `<option value="${year}" ${year === state.year ? "selected" : ""}>${year}</option>`).join("")}
            </select>
          </label>
          <label class="jw-search-shell">
            <span class="jw-kicker">${translate("month", "Month")}</span>
            <select id="calendar-month-select">
              ${MONTHS.map((monthItem) => `<option value="${monthItem.value}" ${monthItem.value === state.month ? "selected" : ""}>${escapeHtml(
                lang === "hi" ? monthItem.hi : monthItem.en
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
                lang === "hi" ? "दिन, व्रत, तिथि, या मुहूर्त खोजें" : "Search day, vrat, tithi, or muhurat"
              )}"
            />
          </label>
        </div>

        <div class="calendar-controls__row">
          <div class="jw-inline-scroll">
            ${FILTERS.map((filter) => renderFilterButton(filter, lang)).join("")}
          </div>
          <div class="calendar-view-toggle" role="tablist" aria-label="${escapeHtml(
            lang === "hi" ? "कैलेंडर दृश्य" : "Calendar view"
          )}">
            <button type="button" class="${state.view === "month" ? "is-active" : ""}" data-action="view" data-value="month">
              ${translate("month_view", "Month view")}
            </button>
            <button type="button" class="${state.view === "list" ? "is-active" : ""}" data-action="view" data-value="list">
              ${translate("list_view", "List view")}
            </button>
          </div>
        </div>
      </section>

      <section class="jw-container digital-panchang__shell">
        <div class="digital-panchang__topbar">
          <div>
            <span class="jw-kicker">${translate("calendar_month", "Calendar month")}</span>
            <h2>${escapeHtml(month ? localizedMonthTitle(month, lang) : translate("no_calendar_records_found", "No calendar records found"))}</h2>
            <p class="m-0 text-sm leading-7 text-stone-600">
              ${escapeHtml(
                lang === "hi"
                  ? "नीचे के दिन-कार्ड स्रोत स्कैन पर आधारित हैं। शेष विवरण मैन्युअल निकासी पर निर्भर हैं।"
                  : "The day cards below are source-scan based. Remaining details depend on manual extraction."
              )}
            </p>
          </div>
          <div class="digital-panchang__month-nav">
            ${MONTHS.map((monthItem) => renderMonthButton(monthItem, lang)).join("")}
          </div>
        </div>

        <div class="panchang-layout">
          <section class="panchang-month-card">
            ${state.view === "month" ? renderMonthGrid(month, days, selectedDay, lang, sourceMonth) : renderMonthList(month, days, selectedDay, lang, sourceMonth)}
          </section>

          <aside class="panchang-detail-panel">
            ${renderDayDetailPanel(selectedDay, month, lang)}
          </aside>
        </div>
      </section>

      <section class="jw-container">
        <div class="jw-section-title">
          <div>
            <span class="jw-kicker">${translate("jain_panchang_source_archive", "Jain Panchang Source Archive")}</span>
            <h2 class="mt-3 text-2xl font-semibold tracking-tight text-stone-900">
              ${translate("jain_panchang_source_archive", "Jain Panchang Source Archive")}
            </h2>
          </div>
          <a class="jw-btn jw-btn-secondary" href="/source-archive.html">
            ${translate("source_archive", "Source Archive")}
          </a>
        </div>

        <div class="panchang-archive-grid">
          ${archiveImages.map((item, index) => renderArchiveCard(item, index, backPage, lang)).join("")}
        </div>
      </section>

      <section class="jw-container panchang-explanation">
        <div class="jw-section-title">
          <div>
            <span class="jw-kicker">${translate("educational_overview", "Educational overview")}</span>
            <h2 class="mt-3 text-2xl font-semibold tracking-tight text-stone-900">
              ${translate("educational_overview", "Educational overview")}
            </h2>
          </div>
        </div>
        <div class="panchang-explanation__grid">
          ${renderExplanationCards(lang)}
        </div>
      </section>

      <section class="jw-container panchang-overview">
        <div class="jw-section-title">
          <div>
            <span class="jw-kicker">${translate("festivals", "Festivals")}</span>
            <h2 class="mt-3 text-2xl font-semibold tracking-tight text-stone-900">
              ${translate("festivals", "Festivals")}
            </h2>
          </div>
        </div>
        <div class="calendar-list calendar-list--compact">
          ${renderOverviewCards(lang)}
        </div>
      </section>

      ${renderSourceModal(archiveImages, lang)}
    </section>
  `;

  updateLanguageDOM(lang);
}

function renderFilterButton(filter, lang) {
  const active = state.filter === filter.key ? "is-active" : "";
  return `
    <button
      type="button"
      class="calendar-filter ${active}"
      data-action="filter"
      data-value="${escapeHtml(filter.key)}"
    >
      ${escapeHtml(lang === "hi" ? filter.labelHi : filter.label)}
    </button>
  `;
}

function renderMonthButton(month, lang) {
  const active = month.value === state.month ? "is-active" : "";
  return `
    <button
      type="button"
      class="panchang-month-nav__button ${active}"
      data-action="month"
      data-value="${month.value}"
    >
      <span>${escapeHtml(lang === "hi" ? month.hi : month.en)}</span>
      <small>${month.value}</small>
    </button>
  `;
}

function renderMonthGrid(month, days, selectedDay, lang, sourceMonth) {
  if (!month) {
    return renderEmptyState(lang);
  }

  const visibleDays = days.filter((day) => matchesFilter(day, state.filter) && matchesQuery(day, state.query));
  if (!visibleDays.length) {
    return renderEmptyState(lang);
  }

  const firstDayIndex = new Date(state.year, month.month_number - 1, 1).getDay();
  const blanks = Array.from({ length: firstDayIndex }, () => `<div class="panchang-day panchang-day--blank" aria-hidden="true"></div>`);
  const selectedKey = selectedDay?.gregorian_date || state.selectedDayKey;

  const dayCells = days.map((day) => {
    const isSelected = day.gregorian_date === selectedKey;
    const isToday = isTodayKey(day.gregorian_date);
    const isMatch = matchesQuery(day, state.query);
    return `
      <button
        type="button"
        class="panchang-day ${isSelected ? "panchang-day--selected" : ""} ${isToday ? "panchang-day--today" : ""} ${day.date_confidence === "needs_review" ? "panchang-day--review" : ""} ${isMatch ? "panchang-day--match" : ""}"
        data-action="select-day"
        data-date="${escapeHtml(day.gregorian_date || "")}"
        aria-label="${escapeHtml(day.title || day.date_display || "")}"
      >
        <span class="panchang-day__number">${escapeHtml(String(day.day_number || ""))}</span>
        <span class="panchang-day__label">${escapeHtml(lang === "hi" ? day.weekday_hi : day.weekday)}</span>
        <span class="panchang-day__meta">${escapeHtml(day.short_label || translate("manual_extraction_pending", "Manual extraction pending"))}</span>
        <div class="panchang-chip-row">
          ${renderDayChips(day, lang)}
        </div>
      </button>
    `;
  });

  return `
    <div class="panchang-grid-wrap">
      <div class="panchang-legend">
        <span class="panchang-chip panchang-chip--review">${translate("date_needs_review", "Date needs review")}</span>
        <span class="panchang-chip panchang-chip--source">${translate("source_provided", "Source provided")}</span>
        <span class="panchang-chip panchang-chip--festival">${translate("local_verification_required", "Local verification required")}</span>
      </div>
      <div class="panchang-grid">
        ${WEEKDAYS.map((weekday) => `<div class="panchang-weekday">${escapeHtml(lang === "hi" ? weekday.hi : weekday.en)}</div>`).join("")}
        ${blanks.join("")}
        ${dayCells.join("")}
      </div>
    </div>
  `;
}

function renderMonthList(month, days, selectedDay, lang) {
  if (!month) {
    return renderEmptyState(lang);
  }

  const visibleDays = days.filter((day) => matchesFilter(day, state.filter) && matchesQuery(day, state.query));
  if (!visibleDays.length) {
    return renderEmptyState(lang);
  }

  const selectedKey = selectedDay?.gregorian_date || state.selectedDayKey;

  return `
    <div class="calendar-list">
      ${visibleDays.map((day) => renderDayListCard(day, day.gregorian_date === selectedKey, lang)).join("")}
    </div>
  `;
}

function renderDayListCard(day, isSelected, lang) {
  return `
    <article class="calendar-event-card ${isSelected ? "is-selected" : ""}">
      <div class="flex flex-wrap items-center gap-2">
        <span class="jw-badge jw-badge--pending-review">${escapeHtml(lang === "hi" ? "दिन" : "Day")} ${escapeHtml(String(day.day_number || ""))}</span>
        <span class="calendar-confidence-badge ${confidenceClass(day.date_confidence)}">${escapeHtml(confidenceLabel(day.date_confidence, lang))}</span>
        <span class="jw-badge">${escapeHtml(lang === "hi" ? day.weekday_hi : day.weekday)}</span>
      </div>
      <h3>${escapeHtml(lang === "hi" ? (day.title_hi || day.title) : (day.title || day.title_hi || ""))}</h3>
      <p>${escapeHtml(day.short_label || day.summary || day.source_note || (lang === "hi" ? "मैन्युअल निकासी लंबित" : "Manual extraction pending"))}</p>
      <div class="jw-meta">
        <span>${translate("source", "Source")}: ${escapeHtml(day.source_name || "")}</span>
        <span>${translate("extraction_status", "Extraction status")}: ${escapeHtml(day.extraction_status || "")}</span>
      </div>
      <div class="panchang-source-note">
        <strong>${translate("local_verification_required", "Local verification required")}</strong>
        <p>${escapeHtml(day.caution_note || DEFAULT_CAUTION_EN)}</p>
      </div>
      <div class="detail-cta">
        <button type="button" class="jw-btn jw-btn-primary" data-action="select-day" data-date="${escapeHtml(day.gregorian_date || "")}">
          ${translate("day_details", "Day details")}
        </button>
        <a class="jw-btn" href="/corrections.html?topic=panchang">
          ${translate("report_calendar_correction", "Report calendar correction")}
        </a>
      </div>
    </article>
  `;
}

function renderDayDetailPanel(day, month, lang) {
  if (!day) {
    return `
      <div class="panchang-detail-panel__empty">
        <h2>${translate("date_needs_review", "Date needs review")}</h2>
        <p>${escapeHtml(
          lang === "hi"
            ? "किसी दिन पर क्लिक करके विवरण खोलें। मैन्युअल निकासी पूरी होने तक यह डेटाबेस स्रोत-साक्ष्य के रूप में रहेगा।"
            : "Click any date to open details. This remains a source reference until manual extraction is complete."
        )}</p>
      </div>
    `;
  }

  const activeTab = DETAIL_TABS.find((tab) => tab.key === state.activeTab) ? state.activeTab : "day";
  const tabs = DETAIL_TABS.map((tab) => {
    const active = activeTab === tab.key ? "is-active" : "";
    return `
      <button type="button" class="panchang-detail-tabs__button ${active}" data-action="tab" data-value="${escapeHtml(tab.key)}">
        ${escapeHtml(lang === "hi" ? tab.labelHi : tab.label)}
      </button>
    `;
  }).join("");

  return `
    <div class="panchang-detail-panel__header">
      <div>
        <span class="jw-kicker">${translate("selected_day", "Selected day")}</span>
        <h2>${escapeHtml(lang === "hi" ? day.title_hi || day.title : day.title || day.title_hi || "")}</h2>
        <p>${escapeHtml(day.date_display_hi || day.date_display || "")}</p>
      </div>
      <div class="panchang-source-actions">
        <span class="calendar-confidence-badge ${confidenceClass(day.date_confidence)}">${escapeHtml(confidenceLabel(day.date_confidence, lang))}</span>
        <span class="jw-badge">${escapeHtml(lang === "hi" ? day.weekday_hi : day.weekday)}</span>
      </div>
    </div>

    <div class="panchang-detail-tabs" role="tablist" aria-label="${escapeHtml(lang === "hi" ? "दिन विवरण टैब" : "Day detail tabs")}">
      ${tabs}
    </div>

    <div class="panchang-detail-body">
      ${renderDetailTabBody(day, month, activeTab, lang)}
    </div>
  `;
}

function renderDetailTabBody(day, month, tab, lang) {
  if (tab === "muhurat") {
    return renderDetailRows([
      ["Sunrise", day.muhurat?.sunrise],
      ["Sunset", day.muhurat?.sunset],
      ["Navkarsi", day.muhurat?.navkarsi],
      ["Porshi", day.muhurat?.porshi],
      ["Sadha Porshi", day.muhurat?.sadha_porshi],
      ["Purimaddha", day.muhurat?.purimaddha],
      ["Avaddha", day.muhurat?.avaddha]
    ], lang);
  }

  if (tab === "nakshatra") {
    return renderDetailRows([
      ["Jain lunar date", day.lunar_tithi || day.short_label],
      ["Lunar month", day.lunar_month],
      ["Paksha", day.paksha],
      ["Nakshatra", day.nakshatra]
    ], lang, true);
  }

  if (tab === "hora") {
    return `
      <div class="panchang-detail-row">
        <strong>${translate("hora", "Hora")}</strong>
        <p>${escapeHtml(day.hora || (lang === "hi" ? "मैन्युअल निकासी लंबित" : "Manual extraction pending"))}</p>
      </div>
      <div class="panchang-detail-row">
        <strong>${translate("details_pending_manual_extraction", "Details pending manual extraction")}</strong>
        <p>${escapeHtml(
          lang === "hi"
            ? "होरा, नक्षत्र और सूक्ष्म मुहूर्त विवरण अभी समीक्षा पर हैं।"
            : "Hora, nakshatra, and fine-grained muhurat details are still under review."
        )}</p>
      </div>
    `;
  }

  if (tab === "source") {
    const monthImage = month?.source_image || day.source_image;
    const backPdf = month?.source_pdf || day.source_pdf;
    return `
      <div class="panchang-detail-row">
        <strong>${translate("source", "Source")}</strong>
        <p>${escapeHtml(day.source_name || "")}</p>
      </div>
      <div class="panchang-detail-row">
        <strong>${translate("source_credit", "Source Credit")}</strong>
        <p>${escapeHtml(day.source_note || DEFAULT_SOURCE_NOTE_EN)}</p>
      </div>
      <div class="panchang-detail-row">
        <strong>${translate("permission_review_needed", "Permission review needed")}</strong>
        <p>${escapeHtml(
          lang === "hi"
            ? "यह स्रोत-आधारित संदर्भ है। प्रकाशित उपयोग से पहले अनुमति और समीक्षा की पुष्टि करें।"
            : "This is a source-based reference. Confirm permission and review before publication."
        )}</p>
      </div>
      <div class="panchang-source-actions">
        ${
          monthImage
            ? `<button type="button" class="jw-btn jw-btn-primary" data-action="open-source-modal" data-index="${escapeHtml(String(getArchiveImageIndex(monthImage)))}">
                ${translate("view_panchang_page", "View Panchang Page")}
              </button>`
            : ""
        }
        ${
          monthImage
            ? `<a class="jw-btn jw-btn-secondary" href="${escapeHtml(monthImage)}" target="_blank" rel="noopener noreferrer">
                ${translate("open_full_image", "Open full image")}
              </a>`
            : ""
        }
        ${
          backPdf
            ? `<a class="jw-btn" href="${escapeHtml(backPdf)}" target="_blank" rel="noopener noreferrer">
                ${translate("open_panchang_back_pages", "Open Panchang Back Pages")}
              </a>`
            : ""
        }
      </div>
    `;
  }

  return `
    <div class="panchang-detail-row">
      <strong>${translate("day_details", "Day details")}</strong>
      <p>${escapeHtml(day.date_display_hi || day.date_display || "")}</p>
    </div>
    <div class="panchang-detail-row">
      <strong>${translate("extraction_status", "Extraction status")}</strong>
      <p>${escapeHtml(day.extraction_status || "")}</p>
    </div>
    <div class="panchang-detail-row">
      <strong>${translate("review_status", "Review status")}</strong>
      <p>${escapeHtml(day.review_status || "")}</p>
    </div>
    <div class="panchang-detail-row">
      <strong>${translate("source_provided_reference", "Source-provided reference")}</strong>
      <p>${escapeHtml(day.short_label || day.summary || day.source_note || (lang === "hi" ? "मैन्युअल निकासी लंबित" : "Manual extraction pending"))}</p>
    </div>
  `;
}

function renderDetailRows(rows, lang, showPendingMessage = false) {
  const body = rows
    .map(([label, value]) => {
      const translatedLabel = translate(normalizeTranslationKey(label), label);
      return `
        <div class="panchang-detail-row">
          <strong>${escapeHtml(translatedLabel)}</strong>
          <p>${escapeHtml(value || (lang === "hi" ? "मैन्युअल निकासी लंबित" : "Manual extraction pending"))}</p>
        </div>
      `;
    })
    .join("");

  if (!showPendingMessage) {
    return body;
  }

  return `
    ${body}
    <div class="panchang-review-warning">
      ${translate("manual_extraction_pending", "Manual extraction pending")}
    </div>
  `;
}

function renderArchiveCard(item, index, backPage, lang) {
  const permission = item.permission_status || "needs_documented_confirmation";
  const openImageLabel = translate("open_full_image", "Open full image");
  const viewPageLabel = translate("view_panchang_page", "View Panchang Page");
  const backPdfUrl = backPage?.pdf_url || item.pdf_url || "";

  return `
    <article class="panchang-month-card">
      <div class="panchang-month-card__thumb">
        ${
          item.image_url
            ? `<img src="${escapeHtml(item.image_url)}" alt="${escapeHtml(item.title || "")}" loading="lazy" />`
            : `<div class="panchang-month-card__placeholder">
                <span>${escapeHtml(lang === "hi" ? "स्रोत छवि अनुपलब्ध" : "Source image unavailable")}</span>
              </div>`
        }
      </div>
      <div class="panchang-month-card__body">
        <div class="flex flex-wrap items-center gap-2">
          <span class="jw-badge">${escapeHtml(item.month_name_hi || item.month_name || "")}</span>
          <span class="calendar-confidence-badge calendar-confidence--source">${translate("source_provided_reference", "Source-provided reference")}</span>
          <span class="calendar-confidence-badge ${permission === "needs_documented_confirmation" ? "calendar-confidence--review" : "calendar-confidence--source"}">
            ${escapeHtml(lang === "hi" ? "अनुमति समीक्षा आवश्यक" : "Permission review needed")}
          </span>
        </div>
        <h3>${escapeHtml(item.title_hi || item.title || "")}</h3>
        <p>${escapeHtml(item.notes_hi || item.notes || "")}</p>
        <div class="detail-cta">
          <button type="button" class="jw-btn jw-btn-primary" data-action="open-source-modal" data-index="${index}">
            ${escapeHtml(viewPageLabel)}
          </button>
          <a class="jw-btn jw-btn-secondary" href="${escapeHtml(item.image_url || "#")}" target="_blank" rel="noopener noreferrer">
            ${escapeHtml(openImageLabel)}
          </a>
          ${
            backPdfUrl
              ? `<a class="jw-btn" href="${escapeHtml(backPdfUrl)}" target="_blank" rel="noopener noreferrer">
                  ${translate("open_panchang_back_pages", "Open Panchang Back Pages")}
                </a>`
              : ""
          }
        </div>
      </div>
    </article>
  `;
}

function renderExplanationCards(lang) {
  const cards = [
    {
      title: "Festival overview",
      titleHi: "पर्व अवलोकन",
      body: "High-level observances like Paryushan, Samvatsari, Das Lakshan, Mahavir Jayanti, and Diwali in Jain tradition are shown as learning references first.",
      bodyHi: "पर्युषण, संवत्सरी, दशलक्षण, महावीर जयंती और जैन परंपरा की दिवाली जैसे अवलोकन पहले शैक्षिक संदर्भ के रूप में दिखाए जाते हैं।"
    },
    {
      title: "Tithi / Vrat",
      titleHi: "तिथि / व्रत",
      body: "Exact tithis and vrat observances can vary by panchang, local sangh, and tradition, so they stay review-first until verified.",
      bodyHi: "सटीक तिथि और व्रत पालन पंचांग, स्थानीय संघ और परंपरा के अनुसार भिन्न हो सकते हैं, इसलिए वे सत्यापन तक समीक्षा-प्रथम रहते हैं।"
    },
    {
      title: "Ayambil",
      titleHi: "आयंबिल",
      body: "Ayambil entries should remain family-friendly, concise, and carefully reviewed before any exact date is published.",
      bodyHi: "आयंबिल प्रविष्टियाँ परिवार-उपयुक्त, संक्षिप्त और किसी भी सटीक तिथि के प्रकाशन से पहले सावधानीपूर्वक समीक्षा की हुई रहनी चाहिए।"
    },
    {
      title: "Local verification",
      titleHi: "स्थानीय सत्यापन",
      body: "For important religious decisions, users should check the local sangh or a trusted panchang.",
      bodyHi: "महत्वपूर्ण धार्मिक निर्णयों के लिए उपयोगकर्ताओं को स्थानीय संघ या विश्वसनीय पंचांग से जाँच करनी चाहिए।"
    }
  ];

  return cards
    .map((card) => `
      <article class="jw-card jw-card-flat p-5">
        <span class="jw-kicker">${escapeHtml(lang === "hi" ? card.titleHi : card.title)}</span>
        <h3 class="mt-3 text-lg font-semibold text-stone-900">${escapeHtml(lang === "hi" ? card.titleHi : card.title)}</h3>
        <p class="m-0 mt-3 text-sm leading-7 text-stone-600">${escapeHtml(lang === "hi" ? card.bodyHi : card.body)}</p>
      </article>
    `)
    .join("");
}

function renderOverviewCards(lang) {
  const overviewItems = state.overview.slice(0, 8);
  if (!overviewItems.length) {
    return `
      <article class="calendar-event-card">
        <h3>${translate("no_calendar_records_found", "No calendar records found")}</h3>
        <p>${escapeHtml(lang === "hi" ? "शिक्षात्मक पर्व अवलोकन अभी उपलब्ध नहीं है।" : "Educational festival overview is not available yet.")}</p>
      </article>
    `;
  }

  return overviewItems.map((item) => {
    const title = pickLocalized(item, "title", lang) || item.title || item.title_hi || "";
    const summary = pickLocalized(item, "summary", lang) || item.summary || item.summary_hi || "";
    const caution = pickLocalized(item, "caution_note", lang) || item.caution_note || item.caution_note_hi || DEFAULT_CAUTION_EN;
    return `
      <article class="calendar-event-card">
        <div class="flex flex-wrap items-center gap-2">
          <span class="jw-badge">${escapeHtml(item.event_type || item.type || "learning")}</span>
          <span class="calendar-confidence-badge ${confidenceClass(item.date_confidence)}">${escapeHtml(confidenceLabel(item.date_confidence, lang))}</span>
        </div>
        <h3>${escapeHtml(title)}</h3>
        <p>${escapeHtml(summary)}</p>
        <div class="panchang-source-note">
          <strong>${translate("source", "Source")}</strong>
          <p>${escapeHtml(item.source_name || "")}</p>
        </div>
        <div class="panchang-source-note">
          <strong>${translate("local_verification_required", "Local verification required")}</strong>
          <p>${escapeHtml(caution)}</p>
        </div>
      </article>
    `;
  }).join("");
}

function renderSourceModal(archiveImages, lang) {
  const active = state.archiveImageIndex >= 0 ? "is-open" : "";
  const current = state.archiveImageIndex >= 0 ? archiveImages[state.archiveImageIndex] : null;
  const backPage = state.archive.find((item) => item.asset_type === "pdf" && item.pdf_url);

  return `
    <div class="panchang-archive-modal ${active}" role="dialog" aria-modal="true" aria-hidden="${state.archiveImageIndex >= 0 ? "false" : "true"}">
      <div class="panchang-archive-modal__backdrop" data-action="close-source-modal"></div>
      <div class="panchang-archive-modal__dialog">
        <div class="panchang-archive-modal__header">
          <h2>${escapeHtml(current?.title_hi || current?.title || translate("view_panchang_page", "View Panchang Page"))}</h2>
          <button type="button" class="jw-btn" data-action="close-source-modal" aria-label="${escapeHtml(translate("close", "Close"))}">&times;</button>
        </div>
        <div class="panchang-archive-modal__content">
          ${
            current?.image_url
              ? `<img class="panchang-archive-modal__image" src="${escapeHtml(current.image_url)}" alt="${escapeHtml(current.title || "")}" />`
              : `<div class="panchang-archive-modal__missing">
                  <p>${escapeHtml(lang === "hi" ? "इस स्रोत के लिए छवि उपलब्ध नहीं है।" : "No image is available for this source.")}</p>
                </div>`
          }
        </div>
        <div class="panchang-archive-modal__footer">
          <div class="panchang-source-actions">
            <button type="button" class="jw-btn jw-btn-secondary" data-action="prev-source">${translate("previous", "Previous")}</button>
            <button type="button" class="jw-btn jw-btn-secondary" data-action="next-source">${translate("next", "Next")}</button>
          </div>
          <div class="panchang-source-actions">
            ${
              current?.image_url
                ? `<a class="jw-btn jw-btn-primary" href="${escapeHtml(current.image_url)}" target="_blank" rel="noopener noreferrer">
                    ${translate("open_full_image", "Open full image")}
                  </a>`
                : ""
            }
            ${
              backPage?.pdf_url
                ? `<a class="jw-btn" href="${escapeHtml(backPage.pdf_url)}" target="_blank" rel="noopener noreferrer">
                    ${translate("open_panchang_back_pages", "Open Panchang Back Pages")}
                  </a>`
                : ""
            }
          </div>
        </div>
        <div class="panchang-source-note">
          <strong>${translate("source_credit", "Source Credit")}</strong>
          <p>${escapeHtml(current?.credit_text || current?.attribution_text || "")}</p>
        </div>
      </div>
    </div>
  `;
}

function renderEmptyState(lang) {
  return `
    <div class="calendar-empty-state">
      <h3>${translate("no_calendar_records_found", "No calendar records found")}</h3>
      <p>${escapeHtml(lang === "hi" ? "इस माह के लिए अभी कोई दिखाने योग्य रिकॉर्ड नहीं है।" : "There are no displayable records for this month yet.")}</p>
    </div>
  `;
}

function wireEvents(root) {
  root.querySelectorAll("[data-action]").forEach((element) => {
    element.addEventListener("click", handleAction);
  });

  const yearSelect = root.querySelector("#calendar-year-select");
  if (yearSelect) {
    yearSelect.addEventListener("change", (event) => {
      state.year = Number(event.target.value) || 2026;
      renderAndBind(root);
    });
  }

  const monthSelect = root.querySelector("#calendar-month-select");
  if (monthSelect) {
    monthSelect.addEventListener("change", (event) => {
      state.month = Number(event.target.value) || 1;
      state.selectedDayKey = getInitialSelectedDayKey(state.digital, state.month);
      renderAndBind(root);
    });
  }

  const searchInput = root.querySelector("#calendar-search-input");
  if (searchInput) {
    searchInput.addEventListener("input", (event) => {
      state.query = event.target.value || "";
      renderAndBind(root);
    });
  }
}

function handleAction(event) {
  const target = event.currentTarget;
  const action = target.getAttribute("data-action");
  const value = target.getAttribute("data-value");
  const date = target.getAttribute("data-date");
  const index = target.getAttribute("data-index");

  if (action === "filter") {
    state.filter = value || "all";
    renderRerender();
    return;
  }

  if (action === "view") {
    state.view = value === "list" ? "list" : "month";
    renderRerender();
    return;
  }

  if (action === "month") {
    state.month = Number(value) || state.month;
    state.selectedDayKey = getInitialSelectedDayKey(state.digital, state.month);
    renderRerender();
    return;
  }

  if (action === "tab") {
    state.activeTab = value || "day";
    renderRerender();
    return;
  }

  if (action === "select-day" && date) {
    state.selectedDayKey = date;
    state.activeTab = "day";
    renderRerender();
    return;
  }

  if (action === "open-source-modal") {
    state.archiveImageIndex = Number(index) || 0;
    renderRerender();
    return;
  }

  if (action === "close-source-modal") {
    state.archiveImageIndex = -1;
    renderRerender();
    return;
  }

  if (action === "prev-source") {
    state.archiveImageIndex = getWrappedArchiveIndex(-1);
    renderRerender();
    return;
  }

  if (action === "next-source") {
    state.archiveImageIndex = getWrappedArchiveIndex(1);
    renderRerender();
    return;
  }
}

function handleDocumentKeydown(event) {
  if (event.key !== "Escape") {
    return;
  }

  if (state.archiveImageIndex < 0) {
    return;
  }

  state.archiveImageIndex = -1;
  renderRerender();
}

function renderRerender() {
  const root = document.getElementById("calendar-app");
  if (!root) {
    return;
  }
  renderCalendarPage(root);
  wireEvents(root);
}

function getWrappedArchiveIndex(delta) {
  const archiveImages = state.archive.filter((item) => item.image_url);
  if (!archiveImages.length) {
    return -1;
  }
  const current = state.archiveImageIndex < 0 ? 0 : state.archiveImageIndex;
  const next = (current + delta + archiveImages.length) % archiveImages.length;
  return next;
}

function getMonthRecord(digital, monthNumber) {
  if (!digital || !Array.isArray(digital.months)) {
    return null;
  }
  return digital.months.find((month) => Number(month.month_number) === Number(monthNumber)) || null;
}

function getVisibleDays(month) {
  const days = Array.isArray(month?.days) ? month.days : [];
  return days.filter((day) => matchesFilter(day, state.filter) && matchesQuery(day, state.query));
}

function matchesFilter(day, filter) {
  if (!filter || filter === "all") {
    return true;
  }

  const value = String(day.event_type || day.type || day.category || "").toLowerCase();
  const chips = Array.isArray(day.chips) ? day.chips.flatMap((chip) => [String(chip.label || "").toLowerCase(), String(chip.label_hi || "").toLowerCase()]) : [];
  const label = `${value} ${chips.join(" ")}`;

  if (filter === "needs_review") {
    return String(day.date_confidence || "").toLowerCase() === "needs_review" || String(day.review_status || "").toLowerCase() === "pending_review";
  }

  if (filter === "tithi_vrat") {
    return ["tithi", "vrat", "ekadashi", "dwadashi", "chaudas"].some((term) => label.includes(term));
  }

  return label.includes(filter);
}

function matchesQuery(day, query) {
  const needle = String(query || "").trim().toLowerCase();
  if (!needle) {
    return true;
  }

  const haystack = [
    day.title,
    day.title_hi,
    day.date_display,
    day.date_display_hi,
    day.weekday,
    day.weekday_hi,
    day.lunar_month,
    day.lunar_month_hi,
    day.lunar_tithi,
    day.lunar_tithi_hi,
    day.paksha,
    day.paksha_hi,
    day.nakshatra,
    day.nakshatra_hi,
    day.hora,
    day.hora_hi,
    day.short_label,
    day.short_label_hi,
    day.summary,
    day.summary_hi,
    day.source_name,
    day.source_note,
    day.source_note_hi,
    day.caution_note,
    day.caution_note_hi,
    Array.isArray(day.chips) ? day.chips.map((chip) => `${chip.label || ""} ${chip.label_hi || ""}`).join(" ") : ""
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();

  return haystack.includes(needle);
}

function getSelectedDay(month) {
  if (!month || !Array.isArray(month.days)) {
    return null;
  }

  const selected = month.days.find((day) => day.gregorian_date === state.selectedDayKey);
  if (selected) {
    return selected;
  }

  return month.days[0] || null;
}

function localizedMonthTitle(month, lang) {
  return lang === "hi" ? `${month.month_name_hi || month.month_name} ${state.year}` : `${month.month_name || month.month_name_hi} ${state.year}`;
}

function getMonthName(monthNumber) {
  return MONTHS.find((month) => month.value === Number(monthNumber)) || MONTHS[0];
}

function getMonthSlug(monthNumber) {
  return getMonthName(monthNumber)?.slug || "january";
}

function formatDateDisplay(dayNumber, monthName) {
  return `${dayNumber} ${monthName}`;
}

function formatDayTitle(dayNumber, weekday, monthName) {
  return `${weekday}, ${formatDateDisplay(dayNumber, monthName)}`;
}

function renderDayChips(day, lang) {
  const chips = [];

  if (day.short_label || day.short_label_hi) {
    chips.push({ label: day.short_label || day.short_label_hi, className: "panchang-chip--festival" });
  }

  if (day.date_confidence === "needs_review" || day.review_status === "pending_review") {
    chips.push({
      label: translate("date_needs_review", "Date needs review"),
      className: "panchang-chip--review"
    });
  }

  if (day.source_name) {
    chips.push({
      label: translate("source_provided", "Source provided"),
      className: "panchang-chip--source"
    });
  }

  if (!chips.length) {
    chips.push({
      label: translate("manual_extraction_pending", "Manual extraction pending"),
      className: "panchang-chip--review"
    });
  }

  return chips
    .slice(0, 3)
    .map((chip) => `<span class="panchang-chip ${chip.className}">${escapeHtml(lang === "hi" && chip.label_hi ? chip.label_hi : chip.label)}</span>`)
    .join("");
}

function confidenceLabel(confidence, lang) {
  const value = String(confidence || "").toLowerCase();
  if (value === "verified") {
    return translate("verified_date", "Verified date");
  }
  if (value === "source_provided") {
    return translate("source_provided", "Source provided");
  }
  if (value === "educational_only") {
    return translate("educational_overview", "Educational overview");
  }
  return translate("date_needs_review", "Date needs review");
}

function confidenceClass(confidence) {
  const value = String(confidence || "").toLowerCase();
  if (value === "verified") {
    return "calendar-confidence--verified";
  }
  if (value === "source_provided") {
    return "calendar-confidence--source";
  }
  if (value === "educational_only") {
    return "calendar-confidence--educational";
  }
  return "calendar-confidence--review";
}

function isTodayKey(gregorianDate) {
  const today = new Date();
  return gregorianDate === toDateKey(today);
}

function getSourceMonthRecord(archive, monthNumber) {
  const monthName = getMonthName(monthNumber);
  return archive.find((item) => String(item.month_name || "").toLowerCase() === monthName.en.toLowerCase()) || archive.find((item) => Number(item.month_number) === Number(monthNumber)) || null;
}

function getArchiveImageIndex(imageUrl) {
  const archiveImages = state.archive.filter((item) => item.image_url);
  return archiveImages.findIndex((item) => item.image_url === imageUrl);
}

function normalizeTranslationKey(label) {
  return String(label || "")
    .trim()
    .toLowerCase()
    .replace(/[.,:;!?()[\]{}"']/g, "")
    .replace(/\s*\/\s*/g, " / ")
    .replace(/\s+/g, "_");
}

function toArray(value) {
  return Array.isArray(value) ? value : [];
}

function toDateKey(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function getTrustNotice(lang) {
  return lang === "hi"
    ? "तिथियाँ पंचांग, स्थान, परंपरा और स्थानीय संघ परंपरा के अनुसार भिन्न हो सकती हैं। महत्वपूर्ण पालन के लिए स्थानीय संघ या विश्वसनीय पंचांग से जाँच करें।"
    : "Dates may vary by panchang, location, tradition, and local sangh practice. Please verify important observances with your local sangh or a trusted panchang.";
}

function escapeHtml(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}
