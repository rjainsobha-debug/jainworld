import { currentLanguage, getLanguage, pickLocalized, translate, translateLabel } from "./language.js";

const DEFAULT_IMAGE = "/images/default.jpg";
const CATEGORY_VISUAL_LABELS_CLEAN = {
  literature: { en: "Scripture", hi: "शास्त्र" },
  philosophy: { en: "Philosophy", hi: "दर्शन" },
  temples: { en: "Temple", hi: "मंदिर" },
  food: { en: "Food", hi: "भोजन" },
  audio: { en: "Audio", hi: "ऑडियो" },
  resources: { en: "Resources", hi: "संसाधन" },
  calendar: { en: "Calendar", hi: "कैलेंडर" },
  children: { en: "Children", hi: "बच्चे" },
  bhajan: { en: "Bhajan", hi: "भजन" },
  aarti: { en: "Aarti", hi: "आरती" },
  course: { en: "Learning", hi: "अध्ययन" }
};
const CATEGORY_VISUAL_LABELS = CATEGORY_VISUAL_LABELS_CLEAN;
const CATEGORY_VISUAL_LABELS_FIXED = {
  literature: { en: "Scripture", hi: "शास्त्र" },
  philosophy: { en: "Philosophy", hi: "दर्शन" },
  temples: { en: "Temple", hi: "मंदिर" },
  food: { en: "Food", hi: "भोजन" },
  audio: { en: "Audio", hi: "ऑडियो" },
  resources: { en: "Resources", hi: "संसाधन" },
  calendar: { en: "Calendar", hi: "कैलेंडर" },
  children: { en: "Children", hi: "बच्चे" },
  bhajan: { en: "Bhajan", hi: "भजन" },
  aarti: { en: "Aarti", hi: "आरती" },
  course: { en: "Learning", hi: "अध्ययन" }
};

function resolveTarget(target) {
  return typeof target === "string" ? document.querySelector(target) : target;
}

function escapeHtml(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function normalizeParagraphs(text) {
  return String(text || "")
    .split("\n")
    .map((paragraph) => paragraph.trim())
    .filter(Boolean)
    .map((paragraph) => `<p>${escapeHtml(paragraph)}</p>`)
    .join("");
}

function renderTrustMeta(entries = []) {
  const cleanEntries = entries.filter(Boolean);
  if (!cleanEntries.length) {
    return "";
  }

  return `
    <div class="jw-meta mt-4">
      ${cleanEntries.map((entry) => `<span>${escapeHtml(entry)}</span>`).join("")}
    </div>
  `;
}

function renderEmptyState(title, body, actionHtml = "") {
  return `
    <div class="jw-card p-5">
      <h3 class="m-0 text-lg font-semibold text-stone-900">${escapeHtml(title)}</h3>
      <p class="m-0 mt-2 text-sm text-stone-600">${escapeHtml(body)}</p>
      ${actionHtml ? `<div class="mt-4">${actionHtml}</div>` : ""}
    </div>
  `;
}

function metaLabel(enLabel, hiLabel, value) {
  if (!value) {
    return "";
  }

  const localized = localizeLabel(enLabel, hiLabel || enLabel) || hiLabel || enLabel;
  return `${localized}: ${value}`;
}

function currentLang() {
  return currentLanguage();
}

function getLocalizedField(item, base, fallback = "") {
  return pickLocalized(item, base, currentLang()) || fallback;
}

function localizeLabel(label, fallback = "") {
  return translateLabel(label, fallback || label);
}

function getLocalizedList(item, base) {
  if (!item || !base) {
    return [];
  }

  const lang = currentLang();
  const directKeys = [
    `${base}_${lang}`,
    `${base}${lang === "hi" ? "Hi" : "En"}`,
    base
  ];

  for (const key of directKeys) {
    const value = item[key];
    if (Array.isArray(value) && value.length) {
      return value.filter(Boolean).map((entry) => String(entry).trim()).filter(Boolean);
    }
  }

  const fallbackKeys = [
    `${base}_${lang === "hi" ? "en" : "hi"}`,
    `${base}${lang === "hi" ? "En" : "Hi"}`
  ];

  for (const key of fallbackKeys) {
    const value = item[key];
    if (Array.isArray(value) && value.length) {
      return value
        .filter(Boolean)
        .map((entry) => (lang === "hi" ? localizeLabel(entry, entry) : String(entry).trim()))
        .filter(Boolean);
    }
  }

  return [];
}

function isUsableImage(value) {
  const normalized = String(value || "").trim().toLowerCase();
  if (!normalized) {
    return false;
  }

  return !(
    normalized === DEFAULT_IMAGE.toLowerCase() ||
    normalized.endsWith("/default.jpg") ||
    normalized.includes("default.jpg")
  );
}

function getVisualCategory(type, item = {}) {
  const raw = [type, item.category, item.subcategory, item.tags].filter(Boolean).join(" ").toLowerCase();
  if (raw.includes("temple") || raw.includes("tirth")) return "temples";
  if (raw.includes("food") || raw.includes("diet") || raw.includes("ingredient")) return "food";
  if (raw.includes("audio") || raw.includes("mantra") || raw.includes("pravachan") || raw.includes("bhajan") || raw.includes("aarti") || raw.includes("stavan")) return raw.includes("bhajan") ? "bhajan" : raw.includes("aarti") ? "aarti" : "audio";
  if (raw.includes("resource") || raw.includes("scholarship") || raw.includes("document")) return "resources";
  if (raw.includes("calendar") || raw.includes("festival") || raw.includes("tithi")) return "calendar";
  if (raw.includes("kid") || raw.includes("child")) return "children";
  if (raw.includes("philosophy") || raw.includes("sutra") || raw.includes("samayasara") || raw.includes("tattvartha")) return "philosophy";
  if (raw.includes("literature") || raw.includes("agama") || raw.includes("scripture") || raw.includes("story")) return "literature";
  return type === "resources" ? "resources" : type === "audio" ? "audio" : type === "temples" ? "temples" : type === "food" ? "food" : "literature";
}

function getVisualLabel(visualType) {
  const lang = currentLang();
  return CATEGORY_VISUAL_LABELS_FIXED[visualType]?.[lang] || CATEGORY_VISUAL_LABELS_FIXED[visualType]?.en || "JainWorld";
}

function renderCategoryVisual(type, item, title) {
  return renderCategoryVisualClean(type, item, title);
}

function getLearningVariant(item = {}) {
  const raw = [
    item.level,
    item.course_level,
    item.category,
    item.topic,
    item.lesson_type,
    item.learning_path,
    item.title,
    item.lesson_title_en
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();

  if (raw.includes("child") || raw.includes("kids")) return "kids";
  if (raw.includes("value") || raw.includes("ahimsa") || raw.includes("aparigraha")) return "values";
  if (raw.includes("practice") || raw.includes("samayik") || raw.includes("pratikraman") || raw.includes("daily")) return "practice";
  if (raw.includes("scripture") || raw.includes("festival") || raw.includes("foundation") || raw.includes("anekant")) return "scripture";
  if (raw.includes("advanced")) return "advanced";
  if (raw.includes("intermediate")) return "intermediate";
  return "beginner";
}

function getLearningIcon(item, variant) {
  const lang = currentLang();
  const icons = {
    beginner: { en: "Knowledge", hi: "ज्ञान" },
    intermediate: { en: "Reflection", hi: "मनन" },
    advanced: { en: "Study", hi: "अध्ययन" },
    practice: { en: "Practice", hi: "साधना" },
    kids: { en: "Family", hi: "परिवार" },
    values: { en: "Values", hi: "अहिंसा" },
    scripture: { en: "Scripture", hi: "शास्त्र" }
  };
  return icons[variant]?.[lang] || icons[variant]?.en || (lang === "hi" ? "ज्ञान" : "Knowledge");
}

function getLearningPathLabel(item) {
  const direct = pickLocalized(item, "path_label", currentLang()) || pickLocalized(item, "learning_path", currentLang());
  if (direct) {
    return direct;
  }

  const level = String(item.level || item.course_level || item.difficulty || "").toLowerCase();
  if (level.includes("advanced")) return translate("advanced_path", "Advanced Path");
  if (level.includes("intermediate")) return translate("intermediate_path", "Intermediate Path");
  return translate("beginner_path", "Beginner Path");
}

function getLearningVisualLabel(item) {
  return (
    pickLocalized(item, "visual_label", currentLang()) ||
    getLocalizedField(item, "topic", "") ||
    pickLocalized(item, "lesson_type", currentLang()) ||
    getLocalizedField(item, "category", "") ||
    pickLocalized(item, "title", currentLang()) ||
    item.lesson_title_en ||
    item.title ||
    ""
  );
}

function getLearningLessonType(item) {
  return (
    pickLocalized(item, "lesson_type", currentLang()) ||
    getLocalizedField(item, "category", "") ||
    getLocalizedField(item, "topic", "") ||
    ""
  );
}

function getLearningLessonNumber(item) {
  const raw = item.lesson_number || item.order || item.lesson_no || "";
  if (!raw) {
    return "";
  }

  return `${translate("lesson", "Lesson")} ${raw}`;
}

function getLearningChips(item) {
  const directChips = getLocalizedList(item, "visual_chips").slice(0, 3);
  if (directChips.length) {
    return directChips;
  }

  const tagChips = getLocalizedList(item, "tags").slice(0, 3);
  if (tagChips.length) {
    return tagChips;
  }

  const fallbacks = [
    getLearningLessonType(item),
    translate("read", "Read"),
    translate("reflect", "Reflect")
  ].filter(Boolean);

  return fallbacks.slice(0, 3);
}

function renderLearningVisual(item) {
  const variant = getLearningVariant(item);
  const icon = getLearningIcon(item, variant);
  const visualLabel = getLearningVisualLabel(item);
  const pathLabel = getLearningPathLabel(item);
  const lessonType = getLearningLessonType(item);
  const lessonNumber = getLearningLessonNumber(item);
  const chips = getLearningChips(item);
  const compactClass = chips.length < 2 ? " learning-visual--compact" : "";

  return `
    <div class="learning-visual learning-visual--${variant}${compactClass}" role="img" aria-label="${escapeHtml(visualLabel || pathLabel || item.title || "Learning")}">
      <div class="learning-visual__meta">
        <span class="learning-visual__icon">${escapeHtml(icon)}</span>
        ${lessonNumber ? `<span class="learning-visual__lesson">${escapeHtml(lessonNumber)}</span>` : ""}
      </div>
      <div class="learning-visual__title">${escapeHtml(visualLabel || lessonType || pathLabel)}</div>
      <div class="learning-visual__subtitle">${escapeHtml(pathLabel)}${lessonType ? ` • ${escapeHtml(lessonType)}` : ""}</div>
      <div class="learning-visual__chips">
        ${chips.map((chip) => `<span>${escapeHtml(chip)}</span>`).join("")}
      </div>
    </div>
  `;
}

function renderCardMedia(type, item, title) {
  if (type === "education" || type === "courses") {
    return renderLearningVisual(item);
  }

  const imageSrc = getImageSrc(item);
  if (isUsableImage(imageSrc)) {
    const alt = getLocalizedField(item, "title", title) || title;
    return `
      <img
        src="${escapeHtml(imageSrc)}"
        alt="${escapeHtml(alt)}"
        class="h-40 w-full rounded-xl border border-stone-200 object-cover"
        onerror="this.onerror=null;this.closest('article')?.querySelector('[data-fallback-visual]')?.classList.remove('hidden'); this.classList.add('hidden');"
        loading="lazy"
      />
      <div class="hidden" data-fallback-visual>${renderCategoryVisualClean(type, item, title)}</div>
    `;
  }

  return renderCategoryVisualClean(type, item, title);
}

function renderCategoryVisualClean(type, item, title) {
  const visualType = getVisualCategory(type, item);
  const visualLabel = getVisualLabel(visualType);
  const icon = visualType === "temples"
    ? "तीर्थ"
    : visualType === "food"
      ? "आहार"
      : visualType === "audio" || visualType === "bhajan" || visualType === "aarti"
        ? "श्रवण"
        : visualType === "resources"
          ? "सहाय"
          : visualType === "calendar"
            ? "पर्व"
            : visualType === "children"
              ? "परिवार"
              : "ज्ञान";

  const fixedIcon = visualType === "temples"
    ? "तीर्थ"
    : visualType === "food"
      ? "आहार"
      : visualType === "audio" || visualType === "bhajan" || visualType === "aarti"
        ? "श्रवण"
        : visualType === "resources"
          ? "सहाय"
          : visualType === "calendar"
            ? "पर्व"
            : visualType === "children"
              ? "परिवार"
              : "ज्ञान";

  return `
    <div class="category-visual category-visual--${visualType}" role="img" aria-label="${escapeHtml(title)}">
      <span class="category-visual__icon" aria-hidden="true">${escapeHtml(fixedIcon || icon)}</span>
      <span class="category-visual__label">${escapeHtml(visualLabel)}</span>
    </div>
  `;
}

function renderBadges(badges = []) {
  const clean = badges.map((badge) => localizeLabel(badge, badge)).filter(Boolean);
  if (!clean.length) {
    return "";
  }

  return `
    <div class="mt-4 flex flex-wrap gap-2">
      ${clean.map((badge) => `<span class="jw-badge">${escapeHtml(badge)}</span>`).join("")}
    </div>
  `;
}

export function buildDetailUrl(type, item) {
  const slug = encodeURIComponent(item.slug || item.id || "");

  if (type === "blogs") {
    return `/article.html?slug=${slug}`;
  }

  if (type === "audio") {
    return `/audio-detail.html?slug=${slug}`;
  }

  if (type === "temples") {
    return `/temple-detail.html?slug=${slug}`;
  }

  if (type === "education" || type === "courses") {
    return `/course-detail.html?slug=${slug}`;
  }

  if (type === "news") {
    return item.source_url || item.canonical_url || item.link || "#";
  }

  if (type === "resources") {
    return item.official_url || "/resources.html";
  }

  return `/article.html?type=${encodeURIComponent(type)}&slug=${slug}`;
}

function getImageSrc(item) {
  return item?.image || DEFAULT_IMAGE;
}

function displayValue(value, fallback = translate("not_available_yet", "Not available yet")) {
  const text = String(value || "").trim();
  return text || fallback;
}

function estimateReadingTime(...segments) {
  const words = segments
    .filter(Boolean)
    .join(" ")
    .trim()
    .split(/\s+/)
    .filter(Boolean).length;

  if (!words) {
    return "";
  }

  const minutes = Math.max(1, Math.round(words / 190));
  return getLanguage() === "hi" ? `${minutes} मिनट` : `${minutes} min`;
}

function detailMetaItem(labelKey, value) {
  if (!value) {
    return "";
  }

  return `<span><strong>${escapeHtml(translate(labelKey, labelKey))}:</strong> ${escapeHtml(value)}</span>`;
}

function renderDetailMeta(items = []) {
  const clean = items.filter(Boolean);
  return clean.length ? `<div class="detail-meta">${clean.join("")}</div>` : "";
}

function renderDetailNote(title, body, extraClass = "") {
  if (!body) {
    return "";
  }

  return `
    <div class="detail-note ${extraClass}">
      <h3>${escapeHtml(title)}</h3>
      <p>${escapeHtml(body)}</p>
    </div>
  `;
}

function renderActionLink(href, label, variant = "secondary") {
  return `<a href="${escapeHtml(href)}" class="jw-button jw-button--${variant}">${escapeHtml(label)}</a>`;
}

function renderDetailActions(actions = []) {
  const clean = actions.filter(Boolean);
  return clean.length ? `<div class="detail-cta">${clean.join("")}</div>` : "";
}

function renderSourceCard(title, summary, href, typeLabel) {
  return `
    <article class="source-card">
      <span class="jw-badge">${escapeHtml(typeLabel)}</span>
      <h3>${href ? `<a href="${escapeHtml(href)}">${escapeHtml(title)}</a>` : escapeHtml(title)}</h3>
      <p>${escapeHtml(summary)}</p>
    </article>
  `;
}

function formatLicenseStatus(value) {
  const key = String(value || "").trim().toLowerCase();
  if (!key) {
    return "";
  }

  const labels = {
    original: translate("curated_by_jainworld", "Curated by JainWorld"),
    public_domain: translate("public_domain", "Public domain"),
    creative_commons: translate("creative_commons", "Creative Commons"),
    permission_received: translate("permission_received", "Permission received"),
    official_link_only: translate("external_link_only", "External link only"),
    metadata_only: translate("metadata_only", "Metadata only"),
    needs_review: translate("permission_review_needed", "Permission review needed"),
    not_allowed: translate("hosting_not_allowed", "Hosting not allowed")
  };

  return labels[key] || localizeLabel(value, value);
}

function renderSourceCreditPanel(item = {}) {
  const sourceName = item.source_name || item.source || "";
  const sourceUrl = item.source_url || item.official_url || item.audio_url || "";
  const license = item.license_name || formatLicenseStatus(item.license_status);
  const attribution = item.attribution_text || "";
  const changesMade = item.changes_made || "";
  const reviewNotes = item.review_notes || item.source_note || "";
  const permissionBadge =
    String(item.permission_status || "").toLowerCase() === "needs_review"
      ? `<span class="jw-badge jw-badge--pending-review">${escapeHtml(
          translate("permission_review_needed", "Permission review needed")
        )}</span>`
      : "";

  if (!sourceName && !sourceUrl && !license && !attribution && !changesMade && !reviewNotes && !permissionBadge) {
    return "";
  }

  return `
    <section class="detail-section">
      <div class="section-header">
        <span class="section-kicker">${escapeHtml(translate("credit", "Credit"))}</span>
        <h2>${escapeHtml(translate("source", "Source"))}</h2>
      </div>
      <article class="source-card">
        <div class="flex flex-wrap gap-2">
          ${permissionBadge}
          ${item.external_link_only ? `<span class="jw-badge">${escapeHtml(translate("external_link_only", "External link only"))}</span>` : ""}
          ${item.hosting_allowed === false ? `<span class="jw-badge">${escapeHtml(translate("hosting_not_allowed", "Hosting not allowed"))}</span>` : ""}
        </div>
        ${sourceName ? `<p><strong>${escapeHtml(translate("source", "Source"))}:</strong> ${sourceUrl ? `<a href="${escapeHtml(sourceUrl)}" target="_blank" rel="noopener noreferrer">${escapeHtml(sourceName)}</a>` : escapeHtml(sourceName)}</p>` : ""}
        ${license ? `<p><strong>${escapeHtml(translate("license", "License"))}:</strong> ${escapeHtml(license)}</p>` : ""}
        ${attribution ? `<p><strong>${escapeHtml(translate("credit", "Credit"))}:</strong> ${escapeHtml(attribution)}</p>` : ""}
        ${changesMade ? `<p><strong>${escapeHtml(translate("attribution", "Attribution"))}:</strong> ${escapeHtml(changesMade)}</p>` : ""}
        ${reviewNotes ? `<p>${escapeHtml(reviewNotes)}</p>` : ""}
        ${
          item.external_link_only && sourceUrl
            ? `<div class="detail-cta">${renderActionLink(sourceUrl, translate("open_source", "Open source"), "ghost")}</div>`
            : ""
        }
      </article>
    </section>
  `;
}

function renderRelatedCards(items = []) {
  if (!items.length) {
    return "";
  }

  return `
    <section class="detail-section">
      <div class="section-header">
        <span class="section-kicker">${escapeHtml(translate("related_content", "Related content"))}</span>
        <h2>${escapeHtml(translate("related_content", "Related content"))}</h2>
      </div>
      <div class="related-grid">
        ${items.map((item) => renderSourceCard(item.title, item.summary, item.href, item.typeLabel)).join("")}
      </div>
    </section>
  `;
}

function renderFaqSection(items = []) {
  if (!Array.isArray(items) || !items.length) {
    return "";
  }

  return `
    <section class="detail-section faq-accordion">
      <div class="section-header">
        <span class="section-kicker">${escapeHtml(translate("faq", "FAQ"))}</span>
        <h2>${escapeHtml(translate("faq", "FAQ"))}</h2>
      </div>
      ${items
        .map(
          (item) => `
            <details>
              <summary>${escapeHtml(item.q)}</summary>
              <p>${escapeHtml(item.a)}</p>
            </details>
          `
        )
        .join("")}
    </section>
  `;
}

function renderBreadcrumb(items = []) {
  const clean = items.filter(Boolean);
  if (!clean.length) {
    return "";
  }

  return `
    <nav class="breadcrumb" aria-label="Breadcrumb">
      ${clean
        .map((item) =>
          item.href
            ? `<a href="${escapeHtml(item.href)}">${escapeHtml(item.label)}</a>`
            : `<span>${escapeHtml(item.label)}</span>`
        )
        .join("<span>/</span>")}
    </nav>
  `;
}

function renderDetailHero({ badge, title, subtitle, meta = "", note = "", visual = "", breadcrumb = "" }) {
  return `
    <header class="detail-hero devotional-hero jain-motif-bg">
      ${breadcrumb}
      <div class="detail-hero-grid">
        <div class="page-banner-copy">
          ${badge ? `<span class="jw-badge">${escapeHtml(badge)}</span>` : ""}
          <h1 class="hero-title">${escapeHtml(title)}</h1>
          ${subtitle ? `<p class="hero-subtitle">${escapeHtml(subtitle)}</p>` : ""}
          ${meta}
          ${note}
        </div>
        <div class="detail-hero-visual">${visual}</div>
      </div>
    </header>
  `;
}

function renderMissingDetailState(titleKey, fallbackTitle, browseHref) {
  return `
    <section class="detail-shell">
      ${renderDetailHero({
        badge: translate(titleKey, fallbackTitle),
        title: translate(titleKey, fallbackTitle),
        subtitle: translate("search_suggestion", "Try JainWorld Search or open the related section below."),
        breadcrumb: renderBreadcrumb([
          { href: "/index.html", label: translate("home", "Home") },
          { label: translate(titleKey, fallbackTitle) }
        ]),
        visual: renderCategoryVisualClean(titleKey === "course" ? "course" : titleKey === "article" ? "literature" : titleKey === "audio" ? "audio" : "temples", {}, translate(titleKey, fallbackTitle))
      })}
      <section class="detail-section">
        ${renderEmptyState(
          translate(titleKey, fallbackTitle),
          translate(`no_${titleKey}_found`, `The requested ${fallbackTitle.toLowerCase()} could not be found.`),
          renderActionLink("/search.html", translate("search_jainworld", "Search JainWorld"), "primary")
        )}
        ${browseHref ? `<div class="mt-5">${renderActionLink(browseHref, fallbackTitle, "ghost")}</div>` : ""}
      </section>
    </section>
  `;
}

function parseFaqData(item) {
  const raw = item?.faq_json || item?.faq || "";
  if (!raw) {
    return [];
  }

  try {
    const parsed = typeof raw === "string" ? JSON.parse(raw) : raw;
    if (Array.isArray(parsed)) {
      return parsed
        .map((entry) => ({ q: entry.q || entry.question || "", a: entry.a || entry.answer || "" }))
        .filter((entry) => entry.q && entry.a);
    }
  } catch (error) {
    return [];
  }

  return [];
}

function getTempleImageSrc(item) {
  if (item?.image) {
    return item.image;
  }

  const photoValue = String(item?.photos || "").trim();
  if (!photoValue) {
    return DEFAULT_IMAGE;
  }

  const firstPhoto = photoValue
    .split(",")
    .map((entry) => entry.trim())
    .find((entry) => /^https?:\/\//i.test(entry) || entry.startsWith("/"));

  return firstPhoto || DEFAULT_IMAGE;
}

function getAudioEmbedUrl(itemOrValue) {
  const value =
    typeof itemOrValue === "object" && itemOrValue
      ? itemOrValue.embed_url || itemOrValue.audio_url || ""
      : itemOrValue || "";

  const raw = String(value || "").trim();
  if (!raw) {
    return "";
  }

  try {
    const url = new URL(raw);
    const host = url.hostname.replace(/^www\./, "");

    if (host === "youtube.com" || host === "m.youtube.com") {
      if (url.pathname === "/watch") {
        const videoId = url.searchParams.get("v");
        if (videoId) {
          return `https://www.youtube.com/embed/${encodeURIComponent(videoId)}`;
        }
      }

      if (url.pathname.startsWith("/embed/")) {
        return url.toString();
      }
    }

    if (host === "youtu.be") {
      const videoId = url.pathname.split("/").filter(Boolean)[0];
      if (videoId) {
        return `https://www.youtube.com/embed/${encodeURIComponent(videoId)}`;
      }
    }
  } catch (error) {
    return raw;
  }

  return raw;
}

function renderIframeCard(embedUrl, title, height = 200) {
  if (!embedUrl) {
    return `<div class="flex h-[${height}px] items-center justify-center rounded-xl border border-stone-200 bg-stone-50 text-sm text-stone-500">Embedded player unavailable.</div>`;
  }

  return `<iframe
    src="${escapeHtml(embedUrl)}"
    width="100%"
    height="${height}"
    class="rounded-xl border border-stone-200"
    loading="lazy"
    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
    allowfullscreen
    title="${escapeHtml(title)}"
  ></iframe>`;
}

export function renderCards(target, items, options = {}) {
  const root = resolveTarget(target);
  if (!root) {
    return;
  }

  const {
    type = "blogs",
    titleBase = "title",
    summaryBase = "summary",
    summaryBuilder = null,
    metaBuilder = () => [],
    mediaBuilder = null,
    badgesBuilder = null,
    linkBuilder = (item) => buildDetailUrl(type, item),
    layoutClass = "jw-grid-2",
    emptyTitle = "Nothing to show yet",
    emptyBody = "Content will appear here as soon as reviewed records are available."
  } = options;

  if (!Array.isArray(items) || items.length === 0) {
    root.innerHTML = renderEmptyState(emptyTitle, emptyBody);
    return;
  }

  const lang = getLanguage();

  root.innerHTML = `
    <div class="${layoutClass}">
      ${items
        .map((item) => {
          const fallbackTitle = item.title || item.name || item.slug || "Untitled";
          const title = pickLocalized(item, titleBase, lang) || localizeLabel(fallbackTitle, fallbackTitle);
          const summary =
            (typeof summaryBuilder === "function" ? summaryBuilder(item, lang) : "") ||
            pickLocalized(item, summaryBase, lang) ||
            item.summary ||
            item.description ||
            item.excerpt ||
            "Structured JainWorld content.";
          const meta = metaBuilder(item).map((entry) => localizeLabel(entry, entry)).filter(Boolean);
          const href = linkBuilder(item);
          const badges = (
            typeof badgesBuilder === "function"
              ? badgesBuilder(item, lang)
              : [
                  getLocalizedField(item, "category", item.category) || localizeLabel(item.category, item.category),
                  getLocalizedField(item, "difficulty", item.difficulty) || localizeLabel(item.difficulty, item.difficulty)
                ]
          ).filter(Boolean);
          const media = typeof mediaBuilder === "function" ? mediaBuilder(item, title, lang) : renderCardMedia(type, item, title);

          return `
            <article class="jw-card p-5">
              ${media}
              ${renderBadges(badges)}
              <h3 class="mt-3 text-lg font-semibold leading-snug text-stone-900">
                <a href="${escapeHtml(href)}" class="hover:text-amber-800">${escapeHtml(title)}</a>
              </h3>
              <p class="m-0 mt-2 text-sm leading-7 text-stone-600">${escapeHtml(summary)}</p>
              ${renderTrustMeta(meta)}
            </article>
          `;
        })
        .join("")}
    </div>
  `;
}

export function renderNews(target, items) {
  const root = resolveTarget(target);
  if (!root) {
    return;
  }

  if (!Array.isArray(items) || items.length === 0) {
    root.innerHTML = renderEmptyState(
      translate("news_empty_title", "No news items are available right now"),
      translate(
        "news_empty_body",
        "Curated Jain updates will appear here after review. Please check back soon."
      )
    );
    return;
  }

  const lang = getLanguage();

  root.innerHTML = `
    <div class="jw-list">
      ${items
        .map((item) => {
          const href = buildDetailUrl("news", item);
          const title = pickLocalized(item, "title", lang) || item.title || item.title_en || "Untitled news entry";
          const summary =
            pickLocalized(item, "summary", lang) || item.summary || item.summary_en || "Curated news for the Jain community.";
          const source = item.source_name || item.source || "Source pending";
          const published = formatDate(item.published_at || item.created_at);
          const status = formatReviewStatus(item.review_status);
          const externalLabel = item.source_url ? translate("external_source", "External source") : "";

          return `
            <article class="jw-card p-5">
              ${renderCardMedia("news", item, title)}
              ${renderBadges([localizeLabel(item.category || "General", item.category || "General"), item.region, status])}
              <h3 class="mt-3 text-lg font-semibold leading-snug text-stone-900">
                <a href="${escapeHtml(href)}" ${item.source_url ? 'target="_blank" rel="noopener noreferrer"' : ""} class="hover:text-amber-800">${escapeHtml(title)}</a>
              </h3>
              <p class="m-0 mt-2 text-sm leading-7 text-stone-600">${escapeHtml(summary)}</p>
              ${renderTrustMeta([
                metaLabel("Source", "स्रोत", source),
                published ? metaLabel("Published", "प्रकाशित", published) : "",
                externalLabel,
                item.review_status === "approved"
                  ? translate("curated_by_jainworld", "Curated by JainWorld")
                  : ""
              ])}
            </article>
          `;
        })
        .join("")}
    </div>
  `;
}

export function renderBlogs(target, items) {
  renderCards(target, items, {
    type: "blogs",
    layoutClass: "jw-list",
    emptyTitle: "No blog articles are available yet",
    emptyBody: "Fresh Jain perspectives will appear here after they are reviewed and published.",
    metaBuilder: (item) => [
      item.author ? metaLabel("Author", "लेखक", item.author) : "",
      item.category,
      formatDate(item.updated_at || item.created_at)
        ? metaLabel("Last updated", "अंतिम अपडेट", formatDate(item.updated_at || item.created_at))
        : "",
      translate("reviewed_by_editorial", "Reviewed by JainWorld Editorial")
    ]
  });
}

export function renderAudio(target, items) {
  const root = resolveTarget(target);
  if (!root) {
    return;
  }

  if (!Array.isArray(items) || items.length === 0) {
    root.innerHTML = renderEmptyState(
      translate("audio_empty_title", "No audio entries are available yet"),
      translate(
        "audio_empty_body",
        "Audio entries will appear here once they are reviewed and approved for listing."
      )
    );
    return;
  }

  root.innerHTML = `
    <div class="jw-list">
      ${items
        .map((item) => {
          const title = item.title || item.slug || "Untitled audio";
          const href = buildDetailUrl("audio", item);
          const embedUrl = getAudioEmbedUrl(item);
          const people = [
            item.speaker ? metaLabel("Speaker", "वक्ता", item.speaker) : "",
            item.singer ? metaLabel("Singer", "गायक", item.singer) : ""
          ]
            .filter(Boolean)
            .join(" | ");

          return `
            <article class="jw-card p-5">
              ${renderIframeCard(embedUrl, title)}
              ${renderBadges([
                item.category || "Audio",
                item.language,
                item.tradition,
                item.verified_status === "verified" ? "Verified" : "",
                formatPermissionStatus(item.permission_status)
              ])}
              <div class="mt-3 flex items-center justify-between gap-3">
                <h3 class="m-0 text-lg font-semibold leading-snug text-stone-900">
                  <a href="${escapeHtml(href)}" class="hover:text-amber-800">${escapeHtml(title)}</a>
                </h3>
                <span class="text-xs text-stone-500">${escapeHtml(item.duration || translate("not_available_yet", "Not available yet"))}</span>
              </div>
              ${renderTrustMeta([
                people,
                item.source ? metaLabel("Source", "स्रोत", item.source) : "",
                item.published_at ? metaLabel("Published", "प्रकाशित", formatDate(item.published_at)) : ""
              ])}
            </article>
          `;
        })
        .join("")}
    </div>
  `;
}

export function renderTemples(target, items) {
  const root = resolveTarget(target);
  if (!root) {
    return;
  }

  if (!Array.isArray(items) || items.length === 0) {
    root.innerHTML = renderEmptyState(
      translate("temples_empty_title", "No temples found"),
      translate(
        "temples_empty_body",
        "Try changing the country, state, city, temple type, or search terms."
      )
    );
    return;
  }

  root.innerHTML = `
    <div class="jw-grid-3">
      ${items
        .map((item) => {
          const rawName =
            (getLanguage() === "hi" ? item.name_hi || item.name : item.name_en || item.name) ||
            item.name_en ||
            item.name_hi ||
            item.slug ||
            "Temple";
          const name = getLanguage() === "hi" ? localizeLabel(rawName, rawName) : rawName;
          const location = [item.city, item.state, item.country].map((entry) => localizeLabel(entry, entry)).filter(Boolean).join(", ") || translate("not_available_yet", "Not available yet");
          const href = buildDetailUrl("temples", item);

          return `
            <article class="jw-card p-5">
              ${renderCategoryVisual("temples", item, name)}
              ${renderBadges([
                getLocalizedField(item, "category", item.category) || localizeLabel(item.category, item.category),
                getLocalizedField(item, "tradition", item.tradition) || item.tradition,
                getLocalizedField(item, "main_deity", item.main_deity) || item.main_deity
              ])}
              <h3 class="mt-4 text-lg font-semibold leading-snug text-stone-900">
                <a href="${escapeHtml(href)}" class="hover:text-amber-800">${escapeHtml(name)}</a>
              </h3>
              <p class="m-0 mt-2 text-sm leading-7 text-stone-600">${escapeHtml(location)}</p>
              ${renderTrustMeta([
                item.timings ? metaLabel("Timings", "समय", item.timings) : "",
                item.last_verified_at
                  ? metaLabel("Last verified", "अंतिम सत्यापन", formatDate(item.last_verified_at))
                  : "",
                item.verified_by ? metaLabel("Verified by", "सत्यापित द्वारा", item.verified_by) : ""
              ])}
            </article>
          `;
        })
        .join("")}
    </div>
  `;
}

export function renderCourses(target, items) {
  renderCards(target, items, {
    type: "education",
    titleBase: "title",
    summaryBase: "summary",
    emptyTitle: "No lessons are available yet",
    emptyBody: "Course lessons will appear here once the reviewed curriculum is published.",
    mediaBuilder: (item) => renderLearningVisual(item),
    badgesBuilder: (item) => [
      pickLocalized(item, "level", currentLang()) || item.level || item.course_level || item.difficulty,
      pickLocalized(item, "category", currentLang()) || item.category,
      pickLocalized(item, "lesson_type", currentLang()) || item.topic
    ],
    metaBuilder: (item) => [
      pickLocalized(item, "learning_path", currentLang()) || item.course_title_en || "",
      item.lesson_number || item.lesson_no ? `${translate("lesson", "Lesson")} ${item.lesson_number || item.lesson_no}` : "",
      formatDate(item.updated_at || item.created_at)
        ? `Last updated: ${formatDate(item.updated_at || item.created_at)}`
        : ""
    ].filter(Boolean)
  });
}

export function renderFoodRules(target, items) {
  const root = resolveTarget(target);
  if (!root) {
    return;
  }

  root.innerHTML = `
    <div class="jw-grid-2">
      ${items
        .map((item) => {
          const lang = getLanguage();
          const spiritualLabel = translate("spiritual", "Spiritual");
          const practicalLabel = translate("practical", "Practical");
          const alternativeLabel = translate("alternative", "Alternative");

          return `
            <article class="jw-card p-5">
              <h3 class="m-0 text-lg font-semibold text-stone-900">${escapeHtml(pickLocalized(item, "title", lang) || item.titleEn || "")}</h3>
              <div class="mt-3 space-y-3 text-sm leading-7 text-stone-600">
                <p class="m-0"><strong class="text-stone-900">${escapeHtml(spiritualLabel)}:</strong> ${escapeHtml(pickLocalized(item, "spiritual", lang) || item.spiritualEn || "")}</p>
                <p class="m-0"><strong class="text-stone-900">${escapeHtml(practicalLabel)}:</strong> ${escapeHtml(pickLocalized(item, "practical", lang) || item.practicalEn || "")}</p>
                <p class="m-0"><strong class="text-stone-900">${escapeHtml(alternativeLabel)}:</strong> ${escapeHtml(pickLocalized(item, "alternative", lang) || item.alternativeEn || "")}</p>
              </div>
            </article>
          `;
        })
        .join("")}
    </div>
  `;
}

export function renderResources(target, items) {
  const root = resolveTarget(target);
  if (!root) {
    return;
  }

  if (!Array.isArray(items) || items.length === 0) {
    root.innerHTML = renderEmptyState(
      translate("resources_empty_title", "No matching resources found"),
      translate("resources_empty_body", "Try a different category, state, or search term."),
      `<a href="/corrections.html" class="jw-btn">${translate("suggest_resource_or_correction", "Suggest a resource or correction")}</a>`
    );
    return;
  }

  const lang = getLanguage();

  root.innerHTML = `
    <div class="jw-list">
      ${items
        .map((item) => {
          const title = pickLocalized(item, "title", lang) || item.title_en || item.title || "Jain resource";
          const summary = pickLocalized(item, "summary", lang) || item.summary_en || "";
          const officialUrl = item.official_url || "";
          const lastVerified = formatDate(item.last_verified_at);
          const reviewStatus = formatReviewStatus(item.review_status);

          return `
            <article class="jw-card p-5">
              ${renderCardMedia("resources", item, title)}
              ${renderBadges([
                getLocalizedField(item, "category", item.category) || localizeLabel(item.category, item.category),
                getLocalizedField(item, "state", item.state) || item.state,
                reviewStatus
              ])}
              <h3 class="mt-4 text-lg font-semibold leading-snug text-stone-900">${escapeHtml(title)}</h3>
              <p class="m-0 mt-2 text-sm leading-7 text-stone-600">${escapeHtml(summary)}</p>
              ${renderTrustMeta([
                item.source_name ? metaLabel("Source", "स्रोत", item.source_name) : "",
                item.eligibility_en ? metaLabel("Eligibility", "पात्रता", item.eligibility_en) : "",
                lastVerified ? metaLabel("Last verified", "अंतिम सत्यापन", lastVerified) : ""
              ])}
              ${
                officialUrl
                  ? `<a href="${escapeHtml(officialUrl)}" target="_blank" rel="noopener noreferrer" class="mt-4 inline-flex text-sm font-semibold text-amber-800 hover:text-amber-900">${escapeHtml(translate("official_link_external", "Official link (external)"))}</a>`
                  : `<p class="m-0 mt-4 text-sm text-stone-500">${escapeHtml(translate("official_link_pending", "Official link will be added after verification."))}</p>`
              }
              <a href="/corrections.html" class="mt-3 inline-flex text-sm font-semibold text-stone-700 hover:text-stone-900">${escapeHtml(translate("suggest_correction", "Suggest correction"))}</a>
            </article>
          `;
        })
        .join("")}
    </div>
  `;
}

export function renderGroupedSearch(target, groups, query) {
  const root = resolveTarget(target);
  if (!root) {
    return;
  }

  const groupNames = {
    blogs: translate("blogs", "Blogs"),
    audio: translate("audio", "Audio"),
    literature: translate("literature", "Literature"),
    temples: translate("temples", "Temples"),
    food: translate("food", "Food"),
    education: translate("education", "Education"),
    news: translate("news", "News"),
    resources: translate("resources", "Resources")
  };

  const nonEmptyGroups = Object.entries(groups).filter(([, items]) => items.length);

  if (!nonEmptyGroups.length) {
    root.innerHTML = renderEmptyState(
      translate("search_no_results", "No results found"),
      getLanguage() === "hi"
        ? `"${query}" के लिए कोई परिणाम नहीं मिला। अहिंसा, महावीर, मंदिर, या पर्युषण जैसे व्यापक शब्द आज़माएँ।`
        : `No results matched "${query}". Try a broader term like Ahimsa, Mahavir, temple, or Paryushan.`
    );
    return;
  }

  root.innerHTML = nonEmptyGroups
    .map(([groupKey, items]) => {
      return `
        <section class="mb-5">
          <div class="jw-section-title">
            <h3 class="text-lg font-semibold text-stone-900">${groupNames[groupKey] || groupKey}</h3>
            <span class="text-sm text-stone-500">${items.length} ${escapeHtml(translate("results_label", "result(s)"))}</span>
          </div>
          <div class="jw-list">
            ${items
              .map((item) => {
                const title =
                  pickLocalized(item, "title") ||
                  pickLocalized(item, "name") ||
                  pickLocalized(item, "lesson_title") ||
                  item.title ||
                  item.name ||
                  item.slug;
                const summary =
                  pickLocalized(item, "summary") ||
                  pickLocalized(item, "history") ||
                  pickLocalized(item, "content") ||
                  item.summary ||
                  item.description ||
                  item.city ||
                  translate("open_result_more_detail", "Open the result to view more detail.");

                return `
                  <article class="jw-card-flat p-4">
                    <div class="flex items-start justify-between gap-3">
                      <div>
                        <h4 class="m-0 text-base font-semibold text-stone-900">
                          <a href="${escapeHtml(buildDetailUrl(groupKey, item))}" class="hover:text-amber-800">${escapeHtml(title)}</a>
                        </h4>
                        <p class="m-0 mt-2 text-sm leading-7 text-stone-600">${escapeHtml(summary)}</p>
                      </div>
                      <span class="jw-badge">${escapeHtml(groupNames[groupKey] || groupKey)}</span>
                    </div>
                  </article>
                `;
              })
              .join("")}
          </div>
        </section>
      `;
    })
    .join("");
}

export function renderArticleDetail(target, item, type = "blogs") {
  const root = resolveTarget(target);
  if (!root) {
    return;
  }

  if (!item) {
    root.innerHTML = renderMissingDetailState("article", "Article", "/literature.html");
    return;
  }

  const title = getLocalizedField(item, "title", item.title || item.slug || "Untitled article");
  const summary = getLocalizedField(item, "summary", item.summary || "Detailed JainWorld article.");
  const content = getLocalizedField(item, "content", item.content || item.method_en || item.content_en || "");
  const spiritualReason = getLocalizedField(item, "spiritual_reason", item.spiritual_reason_en || "");
  const scientificReason = getLocalizedField(item, "scientific_reason", item.scientific_reason_en || "");
  const ingredients = getLocalizedField(item, "ingredients", item.ingredients_en || "");
  const method = getLocalizedField(item, "method", item.method_en || "");
  const readingTime = estimateReadingTime(summary, content, spiritualReason, scientificReason, ingredients, method);
  const lastUpdated = formatDate(item.updated_at || item.created_at);
  const contentType = localizeLabel(type, type);
  const faqItems = parseFaqData(item);
  const relatedItems = [
    {
      title: translate("ask_jainworld", "Ask JainWorld"),
      summary: translate("ask_topic_cta", "Have a question about this topic? Ask JainWorld."),
      href: `/ask.html?q=${encodeURIComponent(title)}`,
      typeLabel: translate("ask", "Ask")
    },
    {
      title: translate("search_jainworld", "Search JainWorld"),
      summary: summary,
      href: `/search.html?q=${encodeURIComponent(item.tags || item.category || title)}`,
      typeLabel: translate("search", "Search")
    },
    {
      title: translate("report_correction", "Report correction"),
      summary: translate("suggest_improvement", "Suggest improvement"),
      href: "/corrections.html",
      typeLabel: translate("reviewed", "Reviewed")
    }
  ];

  root.innerHTML = `
    <article class="detail-shell">
      ${renderDetailHero({
        badge: contentType,
        title,
        subtitle: summary,
        breadcrumb: renderBreadcrumb([
          { href: "/index.html", label: translate("home", "Home") },
          { href: type === "food" ? "/food.html" : type === "literature" ? "/literature.html" : "/blogs.html", label: contentType },
          { label: title }
        ]),
        meta: renderDetailMeta([
          detailMetaItem("source", item.source_note || translate("source_details_reviewed", "Source details are being reviewed")),
          detailMetaItem("last_updated", lastUpdated),
          detailMetaItem("reading_time", readingTime),
          `<span><strong>${escapeHtml(translate("reviewed_by", "Reviewed by"))}:</strong> ${escapeHtml(translate("reviewed_by_editorial", "Reviewed by JainWorld Editorial"))}</span>`
        ]),
        note: renderDetailNote(
          translate("read_with_care", "Read with care"),
          getLanguage() === "hi"
            ? "यह सामग्री अध्ययन और मनन के लिए है। औपचारिक धार्मिक अध्ययन के लिए योग्य आचार्य, शिक्षक या परंपरागत स्रोतों का सहारा लें।"
            : "Use this page for thoughtful reading and reflection. For formal religious study, please consult qualified teachers or traditional sources."
        ),
        visual: renderCardMedia(type === "food" ? "food" : "literature", item, title)
      })}
      <section class="detail-section">
        ${renderBadges([
          getLocalizedField(item, "category", localizeLabel(item.category, item.category)),
          getLocalizedField(item, "subcategory", localizeLabel(item.subcategory, item.subcategory)),
          getLocalizedField(item, "difficulty", localizeLabel(item.difficulty, item.difficulty)),
          item.review_status ? formatReviewStatus(item.review_status) : translate("reviewed", "Reviewed")
        ])}
      </section>
      <section class="detail-section detail-body">
        ${content ? normalizeParagraphs(content) : `<p>${escapeHtml(translate("not_available_yet", "Not available yet"))}</p>`}
      </section>
      ${ingredients ? `<section class="detail-section"><div class="section-header"><span class="section-kicker">${escapeHtml(translate("food", "Food"))}</span><h2>${escapeHtml(localizeLabel("Ingredients", "Ingredients"))}</h2></div><div class="detail-body">${normalizeParagraphs(ingredients)}</div></section>` : ""}
      ${method ? `<section class="detail-section"><div class="section-header"><span class="section-kicker">${escapeHtml(translate("guide", "Guide"))}</span><h2>${escapeHtml(localizeLabel("Method", "Method"))}</h2></div><div class="detail-body">${normalizeParagraphs(method)}</div></section>` : ""}
      ${spiritualReason ? `<section class="detail-section"><div class="section-header"><span class="section-kicker">${escapeHtml(translate("philosophy", "Philosophy"))}</span><h2>${escapeHtml(localizeLabel("Spiritual reason", "Spiritual reason"))}</h2></div><div class="detail-body">${normalizeParagraphs(spiritualReason)}</div></section>` : ""}
      ${scientificReason ? `<section class="detail-section"><div class="section-header"><span class="section-kicker">${escapeHtml(translate("guide", "Guide"))}</span><h2>${escapeHtml(localizeLabel("Scientific or practical reason", "Scientific or practical reason"))}</h2></div><div class="detail-body">${normalizeParagraphs(scientificReason)}</div></section>` : ""}
      ${renderSourceCreditPanel(item)}
      ${renderDetailActions([
        renderActionLink(`/ask.html?q=${encodeURIComponent(title)}`, translate("ask_topic_cta", "Have a question about this topic? Ask JainWorld."), "primary"),
        renderActionLink("/corrections.html", translate("report_correction", "Report correction"), "secondary"),
        renderActionLink("/contribute.html", translate("contribute_information", "Contribute information"), "ghost")
      ])}
      ${renderRelatedCards(relatedItems)}
      ${renderFaqSection(faqItems)}
    </article>
  `;
}

export function renderTempleDetail(target, item) {
  const root = resolveTarget(target);
  if (!root) {
    return;
  }

  if (!item) {
    root.innerHTML = renderMissingDetailState("temple", "Temple", "/temples.html");
    return;
  }

  const title = getLocalizedField(item, "name", item.name_en || item.slug || "Temple detail");
  const history = getLocalizedField(item, "history", item.history_en || "");
  const rituals = getLocalizedField(item, "rituals", item.rituals_en || "");
  const location = [item.city, item.state, item.country].filter(Boolean).join(", ");
  const correctionUrl = item.correction_url || "/corrections.html";
  const lastVerified = formatDate(item.last_verified_at);
  const relatedItems = [
    {
      title: translate("search_jainworld", "Search JainWorld"),
      summary: getLanguage() === "hi" ? "इसी तीर्थ, शहर या परंपरा से जुड़े और परिणाम देखें।" : "Explore more results for this tirth, city, or tradition.",
      href: `/search.html?q=${encodeURIComponent(item.city || item.main_deity || title)}&type=temples`,
      typeLabel: translate("temples", "Temples")
    },
    {
      title: translate("resources", "Resources"),
      summary: getLanguage() === "hi" ? "यात्रा, समुदाय और व्यावहारिक सहायता संसाधन देखें।" : "Open practical travel and community support resources.",
      href: "/resources.html",
      typeLabel: translate("resources", "Resources")
    },
    {
      title: translate("ask_jainworld", "Ask JainWorld"),
      summary: translate("ask_topic_cta", "Have a question about this topic? Ask JainWorld."),
      href: `/ask.html?q=${encodeURIComponent(`${title} temple visit`)}`,
      typeLabel: translate("ask", "Ask")
    }
  ];

  root.innerHTML = `
    <article class="detail-shell">
      ${renderDetailHero({
        badge: getLocalizedField(item, "category", localizeLabel(item.category, item.category)),
        title,
        subtitle: location || translate("not_available_yet", "Not available yet"),
        breadcrumb: renderBreadcrumb([
          { href: "/index.html", label: translate("home", "Home") },
          { href: "/temples.html", label: translate("temples", "Temples") },
          { label: title }
        ]),
        meta: renderDetailMeta([
          detailMetaItem("city", item.city),
          detailMetaItem("state", item.state),
          detailMetaItem("country", item.country),
          detailMetaItem("last_verified", lastVerified),
          detailMetaItem("reviewed_by", item.verified_by || translate("reviewed_by_editorial", "Reviewed by JainWorld Editorial"))
        ]),
        note: renderDetailNote(
          translate("respectful_visit_reminder", "Respectful visit reminder"),
          getLanguage() === "hi"
            ? "समय, धर्मशाला, भोजनशाला और विशेष पर्व व्यवस्था के लिए यात्रा से पहले स्थानीय ट्रस्ट या मंदिर से पुष्टि करें।"
            : "Please confirm timings, stay, meal arrangements, and festival-day access with the local trust before you travel."
        ),
        visual: renderCardMedia("temples", { ...item, image: getTempleImageSrc(item) }, title)
      })}
      <section class="detail-section">
        ${renderBadges([
          getLocalizedField(item, "tradition", localizeLabel(item.tradition, item.tradition)),
          getLocalizedField(item, "main_deity", item.main_deity),
          formatReviewStatus(item.review_status || "verified")
        ])}
      </section>
      <section class="detail-section">
        <div class="jw-grid-2">
          <article class="soft-card p-5">
            <h2>${escapeHtml(translate("before_you_visit", "Before you visit"))}</h2>
            <div class="visit-checklist">
              <span>${escapeHtml(translate("timings", "Timings"))}: ${escapeHtml(displayValue(item.timings))}</span>
              <span>${escapeHtml(translate("dharamshala", "Dharamshala"))}: ${escapeHtml(formatBooleanLabel(item.dharamshala_available))}</span>
              <span>${escapeHtml(translate("bhojanshala", "Bhojanshala"))}: ${escapeHtml(formatBooleanLabel(item.bhojanshala_available))}</span>
              <span>${escapeHtml(translate("parking", "Parking"))}: ${escapeHtml(formatBooleanLabel(item.parking))}</span>
              <span>${escapeHtml(translate("accessibility", "Accessibility"))}: ${escapeHtml(displayValue(item.accessibility, getLanguage() === "hi" ? "कृपया स्थानीय रूप से पुष्टि करें" : "Please verify locally"))}</span>
              <span>${escapeHtml(translate("best_time_to_visit", "Best time to visit"))}: ${escapeHtml(displayValue(item.best_time_to_visit, getLanguage() === "hi" ? "कृपया स्थानीय रूप से पुष्टि करें" : "Please verify locally"))}</span>
            </div>
          </article>
          <article class="soft-card p-5">
            <h2>${escapeHtml(translate("source", "Source"))}</h2>
            <div class="visit-checklist">
              <span>${escapeHtml(translate("address", "Address"))}: ${escapeHtml(displayValue(item.address))}</span>
              <span>${escapeHtml(translate("contact_label", "Contact"))}: ${escapeHtml(displayValue(item.phone || item.contact))}</span>
              <span>${escapeHtml(translate("website_label", "Website"))}: ${escapeHtml(displayValue(item.website))}</span>
              <span>${escapeHtml(translate("map", "Map"))}: ${escapeHtml(item.map_link ? (getLanguage() === "hi" ? "लिंक उपलब्ध" : "Link available") : translate("not_available_yet", "Not available yet"))}</span>
            </div>
            <div class="detail-cta">
              ${item.map_link ? renderActionLink(item.map_link, translate("map", "Map"), "ghost") : ""}
              ${item.website ? renderActionLink(item.website, translate("website_label", "Website"), "ghost") : ""}
            </div>
          </article>
        </div>
      </section>
      ${history ? `<section class="detail-section"><div class="section-header"><span class="section-kicker">${escapeHtml(translate("temple", "Temple"))}</span><h2>${escapeHtml(translate("history", "History"))}</h2></div><div class="detail-body">${normalizeParagraphs(history)}</div></section>` : ""}
      ${rituals ? `<section class="detail-section"><div class="section-header"><span class="section-kicker">${escapeHtml(translate("devotional", "Devotional"))}</span><h2>${escapeHtml(translate("rituals", "Rituals"))}</h2></div><div class="detail-body">${normalizeParagraphs(rituals)}</div></section>` : ""}
      ${renderSourceCreditPanel(item)}
      ${renderDetailActions([
        renderActionLink(correctionUrl, translate("report_correction", "Report correction"), "primary"),
        renderActionLink("/contribute.html", translate("contribute_information", "Contribute information"), "secondary"),
        renderActionLink(`/ask.html?q=${encodeURIComponent(`${title} ${item.city || ""}`)}`, translate("ask_jainworld", "Ask JainWorld"), "ghost")
      ])}
      ${renderRelatedCards(relatedItems)}
    </article>
  `;
}

export function renderAudioDetail(target, item) {
  const root = resolveTarget(target);
  if (!root) {
    return;
  }

  if (!item) {
    root.innerHTML = renderMissingDetailState("audio", "Audio", "/audio.html");
    return;
  }

  const title = getLocalizedField(item, "title", item.title || item.slug || "Audio detail");
  const embedUrl = getAudioEmbedUrl(item);
  const lastUpdated = formatDate(item.published_at || item.created_at);
  const meaning = getLocalizedField(item, "meaning", item.meaning_en || "");
  const lyrics = item.permission_status === "needs_review" ? "" : getLocalizedField(item, "lyrics", item.lyrics_en || "");
  const relatedItems = [
    {
      title: translate("related_audio", "Related audio"),
      summary: getLanguage() === "hi" ? "उसी श्रेणी के और जैन श्रवण विकल्प खोलें।" : "Explore more listening options from the same devotional category.",
      href: `/search.html?q=${encodeURIComponent(item.category || title)}&type=audio`,
      typeLabel: translate("audio", "Audio")
    },
    {
      title: translate("literature", "Literature"),
      summary: getLanguage() === "hi" ? "इसी विषय पर साहित्य और अर्थ पढ़ें।" : "Read literature and meaning notes around this topic.",
      href: `/search.html?q=${encodeURIComponent(item.category || title)}&type=literature`,
      typeLabel: translate("literature", "Literature")
    }
  ];

  root.innerHTML = `
    <article class="detail-shell">
      ${renderDetailHero({
        badge: getLocalizedField(item, "category", localizeLabel(item.category, item.category)),
        title,
        subtitle: meaning || (getLanguage() === "hi" ? "भक्ति, मनन और शांत श्रवण के लिए एक जैन ऑडियो संदर्भ।" : "A Jain audio reference for devotion, reflection, and calm listening."),
        breadcrumb: renderBreadcrumb([
          { href: "/index.html", label: translate("home", "Home") },
          { href: "/audio.html", label: translate("audio", "Audio") },
          { label: title }
        ]),
        meta: renderDetailMeta([
          detailMetaItem("speaker", item.speaker),
          detailMetaItem("singer", item.singer),
          detailMetaItem("language", item.language),
          detailMetaItem("duration", item.duration),
          detailMetaItem("source", item.source),
          detailMetaItem("last_updated", lastUpdated)
        ]),
        note: renderDetailNote(
          translate("listen_with_reflection", "Listen with reflection"),
          item.permission_status === "needs_review"
            ? getLanguage() === "hi"
              ? "इस ऑडियो का अनुमति या स्रोत सत्यापन जारी है। कृपया साझा या पुनर्प्रकाशित करने से पहले अनुमति की पुष्टि करें।"
              : "Permission or source verification is still under review for this audio. Please confirm reuse rights before sharing."
            : getLanguage() === "hi"
              ? "इस ऑडियो को मनन, शांति और आदर के साथ सुनें।"
              : "Listen with reflection and use this audio respectfully."
        ),
        visual: renderIframeCard(embedUrl, title, 340)
      })}
      <section class="detail-section">
        ${renderBadges([
          getLocalizedField(item, "category", localizeLabel(item.category, item.category)),
          item.tradition ? localizeLabel(item.tradition, item.tradition) : "",
          formatPermissionStatus(item.permission_status),
          item.verified_status === "verified" ? translate("verified", "Verified") : ""
        ])}
      </section>
      ${meaning ? `<section class="detail-section"><div class="section-header"><span class="section-kicker">${escapeHtml(translate("meaning", "Meaning"))}</span><h2>${escapeHtml(translate("meaning", "Meaning"))}</h2></div><div class="detail-body">${normalizeParagraphs(meaning)}</div></section>` : ""}
      ${lyrics ? `<section class="detail-section"><div class="section-header"><span class="section-kicker">${escapeHtml(translate("audio", "Audio"))}</span><h2>${escapeHtml(localizeLabel("Transcript", "Transcript"))}</h2></div><div class="detail-body">${normalizeParagraphs(lyrics)}</div></section>` : ""}
      ${renderSourceCreditPanel(item)}
      <section class="detail-section">
        <div class="detail-cta">
          ${item.audio_url ? renderActionLink(item.audio_url, translate("open_external_source", "Open external source"), "ghost") : ""}
          ${renderActionLink("/corrections.html", translate("report_correction", "Report correction"), "secondary")}
          ${renderActionLink("/corrections.html?topic=copyright", translate("report_copyright_concern", "Report copyright concern"), "secondary")}
          ${renderActionLink(`/ask.html?q=${encodeURIComponent(title)}`, translate("ask_jainworld", "Ask JainWorld"), "primary")}
        </div>
      </section>
      ${renderRelatedCards(relatedItems)}
    </article>
  `;
}

export function renderCourseDetail(target, item) {
  const root = resolveTarget(target);
  if (!root) {
    return;
  }

  if (!item) {
    root.innerHTML = renderMissingDetailState("course", "Course", "/education.html");
    return;
  }

  const courseTitle = getLocalizedField(item, "course_title", item.course_title_en || item.course_level || "Course");
  const lessonTitle = getLocalizedField(item, "lesson_title", item.lesson_title_en || item.slug || "Lesson");
  const content = getLocalizedField(item, "content", item.content_en || "");
  const lastUpdated = formatDate(item.updated_at || item.created_at);
  const relatedItems = [
    {
      title: translate("literature", "Literature"),
      summary: getLanguage() === "hi" ? "इसी विषय से संबंधित अध्ययन सामग्री पढ़ें।" : "Read related literature for this learning topic.",
      href: `/search.html?q=${encodeURIComponent(item.topic || lessonTitle)}&type=literature`,
      typeLabel: translate("literature", "Literature")
    },
    {
      title: translate("ask_jainworld", "Ask JainWorld"),
      summary: translate("ask_topic_cta", "Have a question about this topic? Ask JainWorld."),
      href: `/ask.html?q=${encodeURIComponent(lessonTitle)}`,
      typeLabel: translate("ask", "Ask")
    }
  ];

  root.innerHTML = `
    <article class="detail-shell">
      ${renderDetailHero({
        badge: getLocalizedField(item, "difficulty", localizeLabel(item.difficulty || item.course_level, item.difficulty || item.course_level)),
        title: lessonTitle,
        subtitle: courseTitle,
        breadcrumb: renderBreadcrumb([
          { href: "/index.html", label: translate("home", "Home") },
          { href: "/education.html", label: translate("education", "Education") },
          { label: lessonTitle }
        ]),
        meta: renderDetailMeta([
          detailMetaItem("learning_objectives", item.topic),
          item.lesson_no ? `<span><strong>${escapeHtml(translate("lesson", "Lesson"))}:</strong> ${escapeHtml(item.lesson_no)}</span>` : "",
          detailMetaItem("last_updated", lastUpdated),
          `<span><strong>${escapeHtml(translate("reviewed_by", "Reviewed by"))}:</strong> ${escapeHtml(translate("reviewed_by_editorial", "Reviewed by JainWorld Editorial"))}</span>`
        ]),
        note: renderDetailNote(
          translate("family_learning_note", "Learn with family"),
          getLanguage() === "hi"
            ? "इस पाठ को परिवार, बच्चों या अध्ययन समूह के साथ भी शांत गति में पढ़ा जा सकता है।"
            : "This lesson works well for individual study and for calm family or group learning."
        ),
        visual: renderCardMedia("education", item, lessonTitle)
      })}
      <section class="detail-section">
        ${renderBadges([
          getLocalizedField(item, "course_level", localizeLabel(item.course_level, item.course_level)),
          getLocalizedField(item, "difficulty", localizeLabel(item.difficulty, item.difficulty)),
          item.certificate_ready ? displayValue(item.certificate_ready) : ""
        ])}
      </section>
      <section class="detail-section">
        <div class="section-header">
          <span class="section-kicker">${escapeHtml(translate("learning_objectives", "Learning objectives"))}</span>
          <h2>${escapeHtml(translate("learning_objectives", "Learning objectives"))}</h2>
        </div>
        <div class="visit-checklist">
          <span>${escapeHtml(item.topic || lessonTitle)}</span>
          <span>${escapeHtml(getLanguage() === "hi" ? "एक मुख्य विचार शांत मन से समझें।" : "Understand one key idea with calm attention.")}</span>
          <span>${escapeHtml(getLanguage() === "hi" ? "अभ्यास को दैनिक जीवन से जोड़ें।" : "Connect the lesson to daily practice.")}</span>
        </div>
      </section>
      <section class="detail-section detail-body">${content ? normalizeParagraphs(content) : `<p>${escapeHtml(translate("not_available_yet", "Not available yet"))}</p>`}</section>
      <section class="detail-section">
        <div class="section-header">
          <span class="section-kicker">${escapeHtml(translate("practice_this_today", "Practice this today"))}</span>
          <h2>${escapeHtml(translate("practice_this_today", "Practice this today"))}</h2>
        </div>
        <div class="devotional-note">
          <p>${escapeHtml(getLanguage() === "hi" ? "आज एक छोटी बात चुनें: नम्रता से पढ़ें, एक विचार लिखें, या परिवार के साथ इस विषय पर बातचीत करें।" : "Choose one small practice today: read slowly, write one reflection, or discuss the lesson with family.")}</p>
        </div>
      </section>
      ${item.quiz_json ? `<section class="detail-section"><div class="section-header"><span class="section-kicker">${escapeHtml(translate("learning_path", "Learning path"))}</span><h2>${escapeHtml(localizeLabel("Lesson prompts", "Lesson prompts"))}</h2></div><pre class="rounded-xl bg-stone-900 p-4 text-sm text-stone-100">${escapeHtml(item.quiz_json)}</pre></section>` : ""}
      ${renderDetailActions([
        renderActionLink(`/ask.html?q=${encodeURIComponent(lessonTitle)}`, translate("ask_jainworld", "Ask JainWorld"), "primary"),
        renderActionLink("/corrections.html", translate("report_correction", "Report correction"), "secondary"),
        renderActionLink("/contribute.html", translate("contribute_information", "Contribute information"), "ghost")
      ])}
      ${renderRelatedCards(relatedItems)}
    </article>
  `;
}

export function renderStaticInfoCards(target, items) {
  const root = resolveTarget(target);
  if (!root) {
    return;
  }

  const lang = getLanguage();

  root.innerHTML = `
    <div class="jw-grid-3">
      ${items
        .map((item) => {
          const title = pickLocalized(item, "title", lang) || item.titleEn || item.title;
          const summary = pickLocalized(item, "summary", lang) || item.summaryEn || item.summary;
          const href = item.href || "";

          return `
            <article class="jw-card p-5">
              <h3 class="m-0 text-lg font-semibold text-stone-900">
                ${href ? `<a href="${escapeHtml(href)}" class="hover:text-amber-800">${escapeHtml(title)}</a>` : escapeHtml(title)}
              </h3>
              <p class="m-0 mt-3 text-sm leading-7 text-stone-600">${escapeHtml(summary)}</p>
            </article>
          `;
        })
        .join("")}
    </div>
  `;
}

export function formatDate(value) {
  if (!value) {
    return "";
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return String(value);
  }

  return new Intl.DateTimeFormat(getLanguage() === "hi" ? "hi-IN" : "en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric"
  }).format(date);
}

function formatReviewStatus(value) {
  const key = String(value || "").trim().toLowerCase();
  const labels =
    getLanguage() === "hi"
      ? {
          pending_review: "समीक्षा लंबित",
          approved: "संपादित",
          verified: "सत्यापित",
          rejected: "अस्वीकृत",
          needs_update: "अपडेट आवश्यक"
        }
      : {
          pending_review: "Pending review",
          approved: "Curated",
          verified: "Verified",
          rejected: "Rejected",
          needs_update: "Needs update"
        };

  return labels[key] || "";
}

function formatPermissionStatus(value) {
  const key = String(value || "").trim().toLowerCase();
  const labels =
    getLanguage() === "hi"
      ? {
          embedded: "एम्बेडेड",
          permission_received: "अनुमति प्राप्त",
          public_domain: "सार्वजनिक डोमेन",
          needs_review: "समीक्षा आवश्यक"
        }
      : {
          embedded: "Embedded",
          permission_received: "Permission received",
          public_domain: "Public domain",
          needs_review: "Needs review"
        };

  return labels[key] || "";
}

function formatBooleanLabel(value) {
  if (typeof value === "boolean") {
    return value
      ? getLanguage() === "hi"
        ? "उपलब्ध"
        : "Available"
      : getLanguage() === "hi"
        ? "सूचीबद्ध नहीं"
        : "Not listed";
  }

  const normalized = String(value || "").trim().toLowerCase();
  if (!normalized) {
    return getLanguage() === "hi" ? "कृपया स्थानीय रूप से पुष्टि करें" : "Please verify locally";
  }

  if (["yes", "true", "available"].includes(normalized)) {
    return getLanguage() === "hi" ? "उपलब्ध" : "Available";
  }

  if (["no", "false", "not available"].includes(normalized)) {
    return getLanguage() === "hi" ? "उपलब्ध नहीं" : "Not available";
  }

  return String(value);
}
