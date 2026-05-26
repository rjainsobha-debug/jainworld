import { getLanguage, pickLocalized, translate } from "./language.js";

const DEFAULT_IMAGE = "/images/default.jpg";

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

  return `${getLanguage() === "hi" ? hiLabel : enLabel}: ${value}`;
}

function renderBadges(badges = []) {
  const clean = badges.filter(Boolean);
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
          const title =
            pickLocalized(item, titleBase, lang) || item.title || item.name || item.slug || "Untitled";
          const summary =
            (typeof summaryBuilder === "function" ? summaryBuilder(item, lang) : "") ||
            pickLocalized(item, summaryBase, lang) ||
            item.summary ||
            item.description ||
            item.excerpt ||
            "Structured JainWorld content.";
          const meta = metaBuilder(item).filter(Boolean);
          const href = linkBuilder(item);
          const imageSrc = getImageSrc(item);

          return `
            <article class="jw-card p-5">
              <img
                src="${escapeHtml(imageSrc)}"
                alt="${escapeHtml(title)}"
                class="h-40 w-full rounded-xl border border-stone-200 object-cover"
                onerror="this.onerror=null;this.src='${DEFAULT_IMAGE}'"
                loading="lazy"
              />
              ${renderBadges([item.category, item.difficulty])}
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
      getLanguage() === "hi" ? "??? ??? ?????? ?????? ???? ??" : "No news items are available right now",
      getLanguage() === "hi"
        ? "??????? ?? ??? ????? ??? ????? ???? ????? ?????? ????? ??? ?? ??????"
        : "Curated Jain updates will appear here after review. Please check back soon."
    );
    return;
  }

  const lang = getLanguage();

  root.innerHTML = `
    <div class="jw-list">
      ${items
        .map((item) => {
          const href = buildDetailUrl("news", item);
          const imageSrc = getImageSrc(item);
          const title = pickLocalized(item, "title", lang) || item.title || item.title_en || "Untitled news entry";
          const summary =
            pickLocalized(item, "summary", lang) || item.summary || item.summary_en || "Curated news for the Jain community.";
          const source = item.source_name || item.source || "Source pending";
          const published = formatDate(item.published_at || item.created_at);
          const status = formatReviewStatus(item.review_status);
          const externalLabel = item.source_url ? translate("external_source", "External source") : "";

          return `
            <article class="jw-card p-5">
              <img
                src="${escapeHtml(imageSrc)}"
                alt="${escapeHtml(title)}"
                class="h-40 w-full rounded-xl border border-stone-200 object-cover"
                onerror="this.onerror=null;this.src='${DEFAULT_IMAGE}'"
                loading="lazy"
              />
              ${renderBadges([item.category || "General", item.region, status])}
              <h3 class="mt-3 text-lg font-semibold leading-snug text-stone-900">
                <a href="${escapeHtml(href)}" ${item.source_url ? 'target="_blank" rel="noopener noreferrer"' : ""} class="hover:text-amber-800">${escapeHtml(title)}</a>
              </h3>
              <p class="m-0 mt-2 text-sm leading-7 text-stone-600">${escapeHtml(summary)}</p>
              ${renderTrustMeta([
                metaLabel("Source", "?????", source),
                published ? metaLabel("Published", "????????", published) : "",
                externalLabel,
                item.review_status === "approved" ? (getLanguage() === "hi" ? "JainWorld ?????? ?????" : "Curated by JainWorld") : ""
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
      item.author ? metaLabel("Author", "????", item.author) : "",
      item.category,
      formatDate(item.updated_at || item.created_at)
        ? metaLabel("Last updated", "????? ?????", formatDate(item.updated_at || item.created_at))
        : "",
      getLanguage() === "hi" ? "JainWorld ???????? ?????? ????????" : "Reviewed by JainWorld Editorial"
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
      getLanguage() === "hi" ? "??? ??? ????? ????????? ?????? ???? ??" : "No audio entries are available yet",
      getLanguage() === "hi"
        ? "??????? ?? ???????? ?? ??? ????? ???????????? ???? ????? ??????"
        : "Audio entries will appear here once they are reviewed and approved for listing."
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
          const people = [item.speaker ? `Speaker: ${item.speaker}` : "", item.singer ? `Singer: ${item.singer}` : ""]
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
                <span class="text-xs text-stone-500">${escapeHtml(item.duration || "Duration pending")}</span>
              </div>
              ${renderTrustMeta([
                people,
                item.source ? metaLabel("Source", "?????", item.source) : "",
                item.published_at ? metaLabel("Published", "????????", formatDate(item.published_at)) : ""
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
      getLanguage() === "hi" ? "??? ????? ???? ????" : "No temples found",
      getLanguage() === "hi"
        ? "???, ?????, ???, ????? ?????? ?? ??? ???? ????? ??????"
        : "Try changing the country, state, city, temple type, or search terms."
    );
    return;
  }

  root.innerHTML = `
    <div class="jw-grid-3">
      ${items
        .map((item) => {
          const name = item.name_en || item.name_hi || item.name || item.slug || "Temple";
          const location = [item.city, item.state, item.country].filter(Boolean).join(", ") || "Location pending";
          const href = buildDetailUrl("temples", item);

          return `
            <article class="jw-card p-5">
              ${renderBadges([item.category, item.tradition, item.main_deity])}
              <h3 class="mt-4 text-lg font-semibold leading-snug text-stone-900">
                <a href="${escapeHtml(href)}" class="hover:text-amber-800">${escapeHtml(name)}</a>
              </h3>
              <p class="m-0 mt-2 text-sm leading-7 text-stone-600">${escapeHtml(location)}</p>
              ${renderTrustMeta([
                item.timings ? `Timings: ${item.timings}` : "",
                item.last_verified_at ? `Last verified: ${formatDate(item.last_verified_at)}` : "",
                item.verified_by ? `Verified by: ${item.verified_by}` : ""
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
    titleBase: "lesson_title",
    summaryBase: "content",
    emptyTitle: "No lessons are available yet",
    emptyBody: "Course lessons will appear here once the reviewed curriculum is published.",
    metaBuilder: (item) => [
      item.course_level,
      item.topic,
      item.difficulty,
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

          return `
            <article class="jw-card p-5">
              <h3 class="m-0 text-lg font-semibold text-stone-900">${escapeHtml(pickLocalized(item, "title", lang) || item.titleEn || "")}</h3>
              <div class="mt-3 space-y-3 text-sm leading-7 text-stone-600">
                <p class="m-0"><strong class="text-stone-900">Spiritual:</strong> ${escapeHtml(pickLocalized(item, "spiritual", lang) || item.spiritualEn || "")}</p>
                <p class="m-0"><strong class="text-stone-900">Practical:</strong> ${escapeHtml(pickLocalized(item, "practical", lang) || item.practicalEn || "")}</p>
                <p class="m-0"><strong class="text-stone-900">Alternative:</strong> ${escapeHtml(pickLocalized(item, "alternative", lang) || item.alternativeEn || "")}</p>
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
      getLanguage() === "hi" ? "??? ???? ?????? ???? ????" : "No matching resources found",
      getLanguage() === "hi" ? "??? ???? ??????, ????? ?? ??? ???? ????????" : "Try a different category, state, or search term.",
      `<a href="/corrections.html" class="jw-btn">${getLanguage() === "hi" ? "?????? ?? ????? ??????" : "Suggest a resource or correction"}</a>`
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
              ${renderBadges([item.category, item.state, reviewStatus])}
              <h3 class="mt-4 text-lg font-semibold leading-snug text-stone-900">${escapeHtml(title)}</h3>
              <p class="m-0 mt-2 text-sm leading-7 text-stone-600">${escapeHtml(summary)}</p>
              ${renderTrustMeta([
                item.source_name ? metaLabel("Source", "?????", item.source_name) : "",
                item.eligibility_en ? metaLabel("Eligibility", "???????", item.eligibility_en) : "",
                lastVerified ? metaLabel("Last verified", "????? ???????", lastVerified) : ""
              ])}
              ${
                officialUrl
                  ? `<a href="${escapeHtml(officialUrl)}" target="_blank" rel="noopener noreferrer" class="mt-4 inline-flex text-sm font-semibold text-amber-800 hover:text-amber-900">Official link (external)</a>`
                  : `<p class="m-0 mt-4 text-sm text-stone-500">Official link will be added after verification.</p>`
              }
              <a href="/corrections.html" class="mt-3 inline-flex text-sm font-semibold text-stone-700 hover:text-stone-900">Suggest correction</a>
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
    blogs: "Blogs",
    audio: "Audio",
    literature: "Literature",
    temples: "Temples",
    food: "Food",
    education: "Education",
    news: "News",
    resources: "Resources"
  };

  const nonEmptyGroups = Object.entries(groups).filter(([, items]) => items.length);

  if (!nonEmptyGroups.length) {
    root.innerHTML = renderEmptyState(
      getLanguage() === "hi" ? "??? ?????? ???? ????" : "No results found",
      getLanguage() === "hi"
        ? `"${query}" ?? ??? ??? ?????? ???? ????? ??????, ??????, ????? ?? ??????? ???? ??? ???? ????????`
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
            <span class="text-sm text-stone-500">${items.length} result(s)</span>
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
                  "Open the result to view more detail.";

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
    root.innerHTML = `<div class="jw-card p-6 text-stone-600">Not Found</div>`;
    return;
  }

  const title =
    pickLocalized(item, "title") ||
    pickLocalized(item, "lesson_title") ||
    item.title ||
    item.slug ||
    "Untitled article";

  const summary =
    pickLocalized(item, "summary") ||
    item.summary ||
    "Detailed JainWorld article.";

  const content = pickLocalized(item, "content") || item.content || item.method_en || item.content_en || "";
  const spiritualReason = pickLocalized(item, "spiritual_reason") || item.spiritual_reason_en || "";
  const scientificReason = pickLocalized(item, "scientific_reason") || item.scientific_reason_en || "";
  const ingredients = pickLocalized(item, "ingredients") || item.ingredients_en || "";
  const method = pickLocalized(item, "method") || item.method_en || "";
  const imageSrc = getImageSrc(item);
  const lastUpdated = formatDate(item.updated_at || item.created_at);

  root.innerHTML = `
    <article class="jw-card p-6 lg:p-8">
      <img
        src="${escapeHtml(imageSrc)}"
        alt="${escapeHtml(title)}"
        class="h-56 w-full rounded-2xl border border-stone-200 object-cover"
        onerror="this.onerror=null;this.src='${DEFAULT_IMAGE}'"
        loading="lazy"
      />
      ${renderBadges([item.category, item.tags])}
      <h1 class="mt-4 text-3xl font-bold tracking-tight text-stone-900">${escapeHtml(title)}</h1>
      <p class="m-0 mt-4 text-base leading-8 text-stone-600">${escapeHtml(summary)}</p>
      ${renderTrustMeta([
        item.author ? `Author: ${item.author}` : "",
        item.source_note ? `Source: ${item.source_note}` : "",
        lastUpdated ? `Last updated: ${lastUpdated}` : "",
        `Type: ${type}`,
        "Reviewed by JainWorld Editorial"
      ])}
      ${content ? `<div class="jw-prose mt-8">${normalizeParagraphs(content)}</div>` : ""}
      ${ingredients ? `<section class="mt-8"><h2 class="text-xl font-semibold text-stone-900">Ingredients</h2><p class="mt-3 text-stone-600">${escapeHtml(ingredients)}</p></section>` : ""}
      ${method ? `<section class="mt-8"><h2 class="text-xl font-semibold text-stone-900">Method</h2><p class="mt-3 text-stone-600">${escapeHtml(method)}</p></section>` : ""}
      ${spiritualReason ? `<section class="mt-8"><h2 class="text-xl font-semibold text-stone-900">Spiritual reason</h2><p class="mt-3 text-stone-600">${escapeHtml(spiritualReason)}</p></section>` : ""}
      ${scientificReason ? `<section class="mt-8"><h2 class="text-xl font-semibold text-stone-900">Scientific or practical reason</h2><p class="mt-3 text-stone-600">${escapeHtml(scientificReason)}</p></section>` : ""}
    </article>
  `;
}

export function renderTempleDetail(target, item) {
  const root = resolveTarget(target);
  if (!root) {
    return;
  }

  if (!item) {
    root.innerHTML = `<div class="jw-card p-6 text-stone-600">Temple Not Found</div>`;
    return;
  }

  const nameEn = item.name_en || pickLocalized(item, "name") || item.slug || "Temple detail";
  const nameHi = item.name_hi || "";
  const history = item.history_en || pickLocalized(item, "history") || "";
  const rituals = item.rituals_en || pickLocalized(item, "rituals") || "";
  const imageSrc = getTempleImageSrc(item);
  const location = [item.city, item.state, item.country].filter(Boolean).join(", ");
  const correctionUrl = item.correction_url || "/corrections.html";

  root.innerHTML = `
    <article class="jw-card p-6 lg:p-8">
      <img
        src="${escapeHtml(imageSrc)}"
        alt="${escapeHtml(nameEn)}"
        class="h-56 w-full rounded-2xl border border-stone-200 object-cover"
        onerror="this.onerror=null;this.src='${DEFAULT_IMAGE}'"
        loading="lazy"
      />
      ${renderBadges([item.category, item.country, item.tradition, item.main_deity])}
      <h1 class="mt-4 text-3xl font-bold tracking-tight text-stone-900">${escapeHtml(nameEn)}</h1>
      ${nameHi ? `<p class="m-0 mt-2 text-base text-stone-600">${escapeHtml(nameHi)}</p>` : ""}
      ${renderTrustMeta([
        `Location: ${location || "Location will be updated"}`,
        item.timings ? `Timings: ${item.timings}` : "",
        item.last_verified_at ? `Last verified: ${formatDate(item.last_verified_at)}` : "",
        item.verified_by ? `Verified by: ${item.verified_by}` : ""
      ])}
      <p class="m-0 mt-4 text-sm leading-7 text-stone-600">
        Temple details can change. Please verify timings and facilities with the temple or trust before visiting.
      </p>
      <div class="jw-grid-2 mt-8">
        <section class="jw-card-flat p-5">
          <h2 class="m-0 text-lg font-semibold text-stone-900">Location</h2>
          <p class="m-0 mt-3 text-sm leading-7 text-stone-600">${escapeHtml(location || "Location will be updated from the CMS.")}</p>
          <p class="m-0 mt-3 text-sm leading-7 text-stone-600">
            <strong class="text-stone-900">Address:</strong> ${escapeHtml(item.address || "Address will be added after review.")}
          </p>
          ${
            item.map_link
              ? `<a href="${escapeHtml(item.map_link)}" target="_blank" rel="noopener noreferrer" class="mt-4 inline-flex text-sm font-semibold text-amber-800 hover:text-amber-900">Open Google Maps</a>`
              : ""
          }
          ${
            item.website
              ? `<a href="${escapeHtml(item.website)}" target="_blank" rel="noopener noreferrer" class="mt-3 inline-flex text-sm font-semibold text-amber-800 hover:text-amber-900">Temple website</a>`
              : ""
          }
        </section>
        <section class="jw-card-flat p-5">
          <h2 class="m-0 text-lg font-semibold text-stone-900">Temple details</h2>
          <div class="mt-3 grid gap-2 text-sm text-stone-600">
            <span><strong class="text-stone-900">Timings:</strong> ${escapeHtml(item.timings || "To be updated")}</span>
            <span><strong class="text-stone-900">Phone:</strong> ${escapeHtml(item.phone || item.contact || "To be updated")}</span>
            <span><strong class="text-stone-900">Dharamshala:</strong> ${escapeHtml(formatBooleanLabel(item.dharamshala_available))}</span>
            <span><strong class="text-stone-900">Bhojanshala:</strong> ${escapeHtml(formatBooleanLabel(item.bhojanshala_available))}</span>
            <span><strong class="text-stone-900">Parking:</strong> ${escapeHtml(formatBooleanLabel(item.parking))}</span>
            <span><strong class="text-stone-900">Accessibility:</strong> ${escapeHtml(item.accessibility || "Please verify locally")}</span>
            <span><strong class="text-stone-900">Best time to visit:</strong> ${escapeHtml(item.best_time_to_visit || "Please verify locally")}</span>
          </div>
          <a href="${escapeHtml(correctionUrl)}" class="mt-4 inline-flex text-sm font-semibold text-amber-800 hover:text-amber-900">Report correction</a>
        </section>
      </div>
      ${history ? `<section class="mt-8"><h2 class="text-xl font-semibold text-stone-900">History</h2><p class="mt-3 text-stone-600">${escapeHtml(history)}</p></section>` : ""}
      ${rituals ? `<section class="mt-8"><h2 class="text-xl font-semibold text-stone-900">Rituals</h2><p class="mt-3 text-stone-600">${escapeHtml(rituals)}</p></section>` : ""}
    </article>
  `;
}

export function renderAudioDetail(target, item) {
  const root = resolveTarget(target);
  if (!root) {
    return;
  }

  if (!item) {
    root.innerHTML = `<div class="jw-card p-6 text-stone-600">Audio Not Found</div>`;
    return;
  }

  const title = item.title || item.slug || "Audio detail";
  const embedUrl = getAudioEmbedUrl(item);
  const lastUpdated = formatDate(item.published_at || item.created_at);

  root.innerHTML = `
    <article class="jw-card p-6 lg:p-8">
      ${renderIframeCard(embedUrl, title, 360)}
      ${renderBadges([
        item.category,
        item.duration,
        item.language,
        item.tradition,
        formatPermissionStatus(item.permission_status),
        item.verified_status === "verified" ? "Verified" : ""
      ])}
      <h1 class="mt-4 text-3xl font-bold tracking-tight text-stone-900">${escapeHtml(title)}</h1>
      ${renderTrustMeta([
        item.speaker ? `Speaker: ${item.speaker}` : "",
        item.singer ? `Singer: ${item.singer}` : "",
        item.source ? `Source: ${item.source}` : "",
        lastUpdated ? `Published: ${lastUpdated}` : ""
      ])}
      <p class="m-0 mt-4 text-sm leading-7 text-stone-600">
        Audio is embedded or listed only with source and permission status. Copyrighted content should not be uploaded without permission.
      </p>
      ${
        item.meaning_en
          ? `<section class="mt-8"><h2 class="text-xl font-semibold text-stone-900">Meaning or notes</h2><p class="mt-3 text-stone-600">${escapeHtml(item.meaning_en)}</p></section>`
          : ""
      }
      ${
        item.lyrics_en
          ? `<section class="mt-8"><h2 class="text-xl font-semibold text-stone-900">Lyrics or excerpt</h2><p class="mt-3 text-stone-600">${escapeHtml(item.lyrics_en)}</p></section>`
          : ""
      }
      ${
        item.audio_url
          ? `<section class="mt-8"><h2 class="text-xl font-semibold text-stone-900">Source link</h2><a href="${escapeHtml(item.audio_url)}" target="_blank" rel="noopener noreferrer" class="mt-3 inline-flex text-sm font-semibold text-amber-800 hover:text-amber-900">Open external source</a></section>`
          : ""
      }
    </article>
  `;
}

export function renderCourseDetail(target, item) {
  const root = resolveTarget(target);
  if (!root) {
    return;
  }

  if (!item) {
    root.innerHTML = `<div class="jw-card p-6 text-stone-600">The requested course lesson was not found.</div>`;
    return;
  }

  const courseTitle = pickLocalized(item, "course_title") || item.course_title_en || item.course_level || "Course";
  const lessonTitle = pickLocalized(item, "lesson_title") || item.lesson_title_en || item.slug || "Lesson";
  const content = pickLocalized(item, "content") || item.content_en || "";
  const imageSrc = getImageSrc(item);
  const lastUpdated = formatDate(item.updated_at || item.created_at);

  root.innerHTML = `
    <article class="jw-card p-6 lg:p-8">
      <img
        src="${escapeHtml(imageSrc)}"
        alt="${escapeHtml(lessonTitle)}"
        class="h-56 w-full rounded-2xl border border-stone-200 object-cover"
        onerror="this.onerror=null;this.src='${DEFAULT_IMAGE}'"
        loading="lazy"
      />
      ${renderBadges([item.course_level, item.difficulty, item.certificate_ready])}
      <h1 class="mt-4 text-3xl font-bold tracking-tight text-stone-900">${escapeHtml(lessonTitle)}</h1>
      <p class="m-0 mt-3 text-base text-stone-600">${escapeHtml(courseTitle)}</p>
      ${renderTrustMeta([
        item.topic ? `Topic: ${item.topic}` : "",
        item.lesson_no ? `Lesson ${item.lesson_no}` : "",
        lastUpdated ? `Last updated: ${lastUpdated}` : "",
        "Reviewed by JainWorld Editorial"
      ])}
      <div class="jw-prose mt-8">${normalizeParagraphs(content)}</div>
      ${
        item.quiz_json
          ? `<section class="mt-8"><h2 class="text-xl font-semibold text-stone-900">Quiz JSON</h2><pre class="mt-3 overflow-auto rounded-xl bg-stone-900 p-4 text-sm text-stone-100">${escapeHtml(item.quiz_json)}</pre></section>`
          : ""
      }
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

  return new Intl.DateTimeFormat("en-IN", {
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