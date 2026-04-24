import { getLanguage, pickLocalized } from "./language.js";

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
    return item.link || "#";
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

function getAudioEmbedUrl(value) {
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
    emptyTitle = "No entries yet",
    emptyBody = "Content will appear here after the CMS starts publishing rows."
  } = options;

  if (!Array.isArray(items) || items.length === 0) {
    root.innerHTML = `
      <div class="jw-card p-5">
        <h3 class="m-0 text-lg font-semibold text-stone-900">${escapeHtml(emptyTitle)}</h3>
        <p class="m-0 mt-2 text-sm text-stone-600">${escapeHtml(emptyBody)}</p>
      </div>
    `;
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
            "Structured Jain knowledge content.";
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
              <div class="mt-4 flex flex-wrap gap-2">
                ${(item.category ? `<span class="jw-badge">${escapeHtml(item.category)}</span>` : "")}
                ${(item.difficulty ? `<span class="jw-badge">${escapeHtml(item.difficulty)}</span>` : "")}
              </div>
              <h3 class="mt-3 text-lg font-semibold leading-snug text-stone-900">
                <a href="${escapeHtml(href)}" class="hover:text-amber-800">${escapeHtml(title)}</a>
              </h3>
              <p class="m-0 mt-2 text-sm leading-7 text-stone-600">${escapeHtml(summary)}</p>
              ${
                meta.length
                  ? `<div class="jw-meta mt-3">${meta
                      .map((entry) => `<span>${escapeHtml(entry)}</span>`)
                      .join("")}</div>`
                  : ""
              }
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
    root.innerHTML = `<div class="jw-card p-5 text-sm text-stone-600">No news items are available yet.</div>`;
    return;
  }

  root.innerHTML = `
    <div class="jw-list">
      ${items
        .map((item) => {
          const href = buildDetailUrl("news", item);
          const imageSrc = getImageSrc(item);
          return `
            <article class="jw-card p-5">
              <img
                src="${escapeHtml(imageSrc)}"
                alt="${escapeHtml(item.title || "News image")}"
                class="h-40 w-full rounded-xl border border-stone-200 object-cover"
                onerror="this.onerror=null;this.src='${DEFAULT_IMAGE}'"
                loading="lazy"
              />
              <div class="mt-4 flex items-center justify-between gap-3">
                <span class="jw-badge">${escapeHtml(item.category || "General")}</span>
                <span class="text-xs text-stone-500">${escapeHtml(formatDate(item.published_at || item.created_at))}</span>
              </div>
              <h3 class="mt-3 text-lg font-semibold leading-snug text-stone-900">
                <a href="${escapeHtml(href)}" target="_blank" rel="noopener noreferrer" class="hover:text-amber-800">${escapeHtml(item.title || "Untitled news entry")}</a>
              </h3>
              <p class="m-0 mt-2 text-sm leading-7 text-stone-600">${escapeHtml(item.summary || "RSS-ready news card for JainWorld.")}</p>
              <p class="m-0 mt-3 text-xs uppercase tracking-[0.18em] text-stone-500">${escapeHtml(item.source || "Source pending")}</p>
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
    metaBuilder: (item) => [item.author, item.category, formatDate(item.created_at)]
  });
}

export function renderAudio(target, items) {
  const root = resolveTarget(target);
  if (!root) {
    return;
  }

  if (!Array.isArray(items) || items.length === 0) {
    root.innerHTML = `<div class="jw-card p-5 text-sm text-stone-600">No audio entries are available yet.</div>`;
    return;
  }

  root.innerHTML = `
    <div class="jw-list">
      ${items
        .map((item) => {
          const title = item.title || item.slug || "Untitled audio";
          const href = buildDetailUrl("audio", item);
          const embedUrl = getAudioEmbedUrl(item.audio_url);

          return `
            <article class="jw-card p-5">
              ${
                embedUrl
                  ? `<iframe
                      src="${escapeHtml(embedUrl)}"
                      width="100%"
                      height="200"
                      class="rounded-xl border border-stone-200"
                      loading="lazy"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowfullscreen
                    ></iframe>`
                  : `<div class="flex h-[200px] items-center justify-center rounded-xl border border-stone-200 bg-stone-50 text-sm text-stone-500">Audio player will appear here.</div>`
              }
              <div class="mt-4 flex items-center justify-between gap-3">
                <span class="jw-badge">${escapeHtml(item.category || "Audio")}</span>
                <span class="text-xs text-stone-500">${escapeHtml(item.duration || "Duration pending")}</span>
              </div>
              <h3 class="mt-3 text-lg font-semibold leading-snug text-stone-900">
                <a href="${escapeHtml(href)}" class="hover:text-amber-800">${escapeHtml(title)}</a>
              </h3>
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
    root.innerHTML = `
      <div class="jw-card p-5">
        <h3 class="m-0 text-lg font-semibold text-stone-900">No temples found</h3>
        <p class="m-0 mt-2 text-sm text-stone-600">Try changing the country, state, city, or search filter.</p>
      </div>
    `;
    return;
  }

  root.innerHTML = `
    <div class="jw-grid-3">
      ${items
        .map((item) => {
          const name = item.name_en || item.name_hi || item.name || item.slug || "Temple";
          const location = [item.city, item.state].filter(Boolean).join(", ") || item.country || "Location pending";
          const href = buildDetailUrl("temples", item);

          return `
            <article class="jw-card p-5">
              <div class="flex flex-wrap gap-2">
                ${(item.category ? `<span class="jw-badge">${escapeHtml(item.category)}</span>` : "")}
                ${(item.country ? `<span class="jw-badge">${escapeHtml(item.country)}</span>` : "")}
              </div>
              <h3 class="mt-4 text-lg font-semibold leading-snug text-stone-900">
                <a href="${escapeHtml(href)}" class="hover:text-amber-800">${escapeHtml(name)}</a>
              </h3>
              <p class="m-0 mt-2 text-sm leading-7 text-stone-600">${escapeHtml(location)}</p>
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
    metaBuilder: (item) => [item.course_level, item.topic, item.difficulty].filter(Boolean)
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
    news: "News"
  };

  const nonEmptyGroups = Object.entries(groups).filter(([, items]) => items.length);

  if (!nonEmptyGroups.length) {
    root.innerHTML = `
      <div class="jw-card p-5">
        <h3 class="m-0 text-lg font-semibold text-stone-900">No results found</h3>
        <p class="m-0 mt-2 text-sm text-stone-600">No results matched "${escapeHtml(query)}". Try a broader term like Ahimsa, Mahavir, temple, or Paryushan.</p>
      </div>
    `;
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
                  "View the result for more detail.";

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
    "Structured JainWorld article detail starter.";

  const content = pickLocalized(item, "content") || item.content || item.method_en || item.content_en || "";
  const spiritualReason = pickLocalized(item, "spiritual_reason") || item.spiritual_reason_en || "";
  const scientificReason = pickLocalized(item, "scientific_reason") || item.scientific_reason_en || "";
  const ingredients = pickLocalized(item, "ingredients") || item.ingredients_en || "";
  const method = pickLocalized(item, "method") || item.method_en || "";
  const imageSrc = getImageSrc(item);

  root.innerHTML = `
    <article class="jw-card p-6 lg:p-8">
      <img
        src="${escapeHtml(imageSrc)}"
        alt="${escapeHtml(title)}"
        class="h-56 w-full rounded-2xl border border-stone-200 object-cover"
        onerror="this.onerror=null;this.src='${DEFAULT_IMAGE}'"
        loading="lazy"
      />
      <div class="mt-5 flex flex-wrap gap-2">
        ${(item.category ? `<span class="jw-badge">${escapeHtml(item.category)}</span>` : "")}
        ${(item.tags ? `<span class="jw-badge">${escapeHtml(item.tags)}</span>` : "")}
      </div>
      <h1 class="mt-4 text-3xl font-bold tracking-tight text-stone-900">${escapeHtml(title)}</h1>
      <p class="m-0 mt-4 text-base leading-8 text-stone-600">${escapeHtml(summary)}</p>
      <div class="jw-meta mt-4">
        ${[item.author, item.source_note, formatDate(item.created_at), type].filter(Boolean).map((entry) => `<span>${escapeHtml(entry)}</span>`).join("")}
      </div>
      ${content ? `<div class="jw-prose mt-8">${content.split("\n").map((paragraph) => `<p>${escapeHtml(paragraph)}</p>`).join("")}</div>` : ""}
      ${ingredients ? `<section class="mt-8"><h2 class="text-xl font-semibold text-stone-900">Ingredients</h2><p class="mt-3 text-stone-600">${escapeHtml(ingredients)}</p></section>` : ""}
      ${method ? `<section class="mt-8"><h2 class="text-xl font-semibold text-stone-900">Method</h2><p class="mt-3 text-stone-600">${escapeHtml(method)}</p></section>` : ""}
      ${spiritualReason ? `<section class="mt-8"><h2 class="text-xl font-semibold text-stone-900">Spiritual Reason</h2><p class="mt-3 text-stone-600">${escapeHtml(spiritualReason)}</p></section>` : ""}
      ${scientificReason ? `<section class="mt-8"><h2 class="text-xl font-semibold text-stone-900">Scientific or Practical Reason</h2><p class="mt-3 text-stone-600">${escapeHtml(scientificReason)}</p></section>` : ""}
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

  root.innerHTML = `
    <article class="jw-card p-6 lg:p-8">
      <img
        src="${escapeHtml(imageSrc)}"
        alt="${escapeHtml(nameEn)}"
        class="h-56 w-full rounded-2xl border border-stone-200 object-cover"
        onerror="this.onerror=null;this.src='${DEFAULT_IMAGE}'"
        loading="lazy"
      />
      <div class="mt-5 flex flex-wrap gap-2">
        ${(item.category ? `<span class="jw-badge">${escapeHtml(item.category)}</span>` : "")}
        ${(item.country ? `<span class="jw-badge">${escapeHtml(item.country)}</span>` : "")}
      </div>
      <h1 class="mt-4 text-3xl font-bold tracking-tight text-stone-900">${escapeHtml(nameEn)}</h1>
      ${nameHi ? `<p class="m-0 mt-2 text-base text-stone-600">${escapeHtml(nameHi)}</p>` : ""}
      <div class="jw-grid-2 mt-8">
        <section class="jw-card-flat p-5">
          <h2 class="m-0 text-lg font-semibold text-stone-900">Location</h2>
          <p class="m-0 mt-3 text-sm leading-7 text-stone-600">${escapeHtml(location || "Location will be updated from the Sheets CMS.")}</p>
          <p class="m-0 mt-3 text-sm leading-7 text-stone-600">
            <strong class="text-stone-900">Address:</strong> ${escapeHtml(item.address || "Address will be added from the Sheets CMS.")}
          </p>
          ${
            item.map_link
              ? `<a href="${escapeHtml(item.map_link)}" target="_blank" rel="noopener noreferrer" class="mt-4 inline-flex text-sm font-semibold text-amber-800 hover:text-amber-900">Open Google Map</a>`
              : ""
          }
        </section>
        <section class="jw-card-flat p-5">
          <h2 class="m-0 text-lg font-semibold text-stone-900">Temple Details</h2>
          <div class="mt-3 grid gap-2 text-sm text-stone-600">
            <span><strong class="text-stone-900">Timings:</strong> ${escapeHtml(item.timings || "To be updated")}</span>
            <span><strong class="text-stone-900">Contact:</strong> ${escapeHtml(item.contact || "To be updated")}</span>
            <span><strong class="text-stone-900">Photos:</strong> ${escapeHtml(item.photos || "Photo gallery can be added later")}</span>
            <span><strong class="text-stone-900">Future-ready:</strong> Nearby Jain food and dharamshala modules can plug in here later.</span>
          </div>
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
  const embedUrl = getAudioEmbedUrl(item.audio_url);

  root.innerHTML = `
    <article class="jw-card p-6 lg:p-8">
      ${
        embedUrl
          ? `<iframe
              src="${escapeHtml(embedUrl)}"
              width="100%"
              height="360"
              class="rounded-2xl border border-stone-200"
              loading="lazy"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowfullscreen
            ></iframe>`
          : `<div class="flex h-[360px] items-center justify-center rounded-2xl border border-stone-200 bg-stone-50 text-sm text-stone-500">Audio player unavailable.</div>`
      }
      <div class="mt-5 flex flex-wrap gap-2">
        ${(item.category ? `<span class="jw-badge">${escapeHtml(item.category)}</span>` : "")}
        ${(item.duration ? `<span class="jw-badge">${escapeHtml(item.duration)}</span>` : "")}
      </div>
      <h1 class="mt-4 text-3xl font-bold tracking-tight text-stone-900">${escapeHtml(title)}</h1>
      <div class="jw-meta mt-4">
        ${[item.speaker, item.category, item.duration, formatDate(item.published_at || item.created_at)]
          .filter(Boolean)
          .map((entry) => `<span>${escapeHtml(entry)}</span>`)
          .join("")}
      </div>
      ${
        item.description
          ? `<section class="mt-8"><h2 class="text-xl font-semibold text-stone-900">Description</h2><p class="mt-3 text-stone-600">${escapeHtml(item.description)}</p></section>`
          : ""
      }
      ${
        item.audio_url
          ? `<section class="mt-8"><h2 class="text-xl font-semibold text-stone-900">Audio Link</h2><a href="${escapeHtml(item.audio_url)}" target="_blank" rel="noopener noreferrer" class="mt-3 inline-flex text-sm font-semibold text-amber-800 hover:text-amber-900">Open Source</a></section>`
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

  root.innerHTML = `
    <article class="jw-card p-6 lg:p-8">
      <img
        src="${escapeHtml(imageSrc)}"
        alt="${escapeHtml(lessonTitle)}"
        class="h-56 w-full rounded-2xl border border-stone-200 object-cover"
        onerror="this.onerror=null;this.src='${DEFAULT_IMAGE}'"
        loading="lazy"
      />
      <div class="mt-5 flex flex-wrap gap-2">
        ${(item.course_level ? `<span class="jw-badge">${escapeHtml(item.course_level)}</span>` : "")}
        ${(item.difficulty ? `<span class="jw-badge">${escapeHtml(item.difficulty)}</span>` : "")}
        ${(item.certificate_ready ? `<span class="jw-badge">${escapeHtml(item.certificate_ready)}</span>` : "")}
      </div>
      <h1 class="mt-4 text-3xl font-bold tracking-tight text-stone-900">${escapeHtml(lessonTitle)}</h1>
      <p class="m-0 mt-3 text-base text-stone-600">${escapeHtml(courseTitle)}</p>
      <div class="jw-meta mt-4">
        ${[item.topic, `Lesson ${item.lesson_no || "1"}`, item.course_level].filter(Boolean).map((entry) => `<span>${escapeHtml(entry)}</span>`).join("")}
      </div>
      <div class="jw-prose mt-8">${content.split("\n").map((paragraph) => `<p>${escapeHtml(paragraph)}</p>`).join("")}</div>
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

          return `
            <article class="jw-card p-5">
              <h3 class="m-0 text-lg font-semibold text-stone-900">${escapeHtml(title)}</h3>
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
