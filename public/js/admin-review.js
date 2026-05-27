console.log("Admin review loaded");

const SESSION_TOKEN_KEY = "jainworld_admin_token";
const LIVE_REVIEW_TYPES = [
  { key: "community", path: "/api/review/community", title: "Pending Community Members" },
  { key: "corrections", path: "/api/review/corrections", title: "Pending Corrections" },
  { key: "news", path: "/api/review/news", title: "Pending News" },
  { key: "resources", path: "/api/review/resources", title: "Pending Resources" },
  { key: "audio", path: "/api/review/audio", title: "Pending Audio" },
  { key: "templeCorrections", apiType: "temple-corrections", path: "/api/review/temple-corrections", title: "Pending Temple Corrections" },
  { key: "images", path: "/api/review/images", title: "Pending Images" },
  { key: "ask", path: "/api/review/ask", title: "Ask Review Queue" }
];

const FALLBACK_FILES = {
  community: "/data/review-community.json",
  corrections: "/data/review-corrections.json",
  news: "/data/review-news.json",
  resources: "/data/review-resources.json",
  audio: "/data/review-audio.json",
  templeCorrections: "/data/review-temple-corrections.json",
  images: "/data/review-images.json",
  ask: "/data/review-ask.json",
  contentGaps: "/data/review-content-gaps.json",
  calendarReview: "/data/review-calendar-events.json",
  calendarQuality: "/data/review-calendar-quality.json",
  communityDirectory: "/data/review-community-directory.json",
  communityDirectoryQuality: "/data/review-community-directory-quality.json",
  speakersReview: "/data/review-speakers.json",
  namesReview: "/data/review-names.json",
  dictionaryReview: "/data/review-dictionary.json",
  resourceQuality: "/data/review-resource-quality.json",
  externalResourcesReview: "/data/review-external-resources.json",
  sourcePermissionReview: "/data/review-source-permissions.json",
  imageCreditsReview: "/data/sample-image-credits.json",
  booksReview: "/data/sample-books.json"
};

const STATUS_ORDER = ["pending_review", "approved", "verified", "needs_update", "rejected", "published", "draft", "archived"];

let currentState = {
  token: "",
  sourceLabel: "Sample JSON fallback",
  collections: {}
};

document.addEventListener("DOMContentLoaded", async () => {
  if (document.body.dataset.page !== "admin-review") {
    return;
  }

  const tokenInput = document.getElementById("admin-token-input");
  const liveButton = document.getElementById("admin-load-live");
  const refreshButton = document.getElementById("admin-refresh-live");
  const sampleButton = document.getElementById("admin-load-sample");

  currentState.token = sessionStorage.getItem(SESSION_TOKEN_KEY) || "";
  if (tokenInput) {
    tokenInput.value = currentState.token;
  }

  bindActionBar(tokenInput, liveButton, refreshButton, sampleButton);
  await loadFallbackMode("Loading sample review queues...");
});

function bindActionBar(tokenInput, liveButton, refreshButton, sampleButton) {
  liveButton?.addEventListener("click", async () => {
    const token = String(tokenInput?.value || "").trim();
    if (!token) {
      setFeedback("Enter an admin token to load live D1 review queues.", "error");
      return;
    }

    sessionStorage.setItem(SESSION_TOKEN_KEY, token);
    currentState.token = token;
    await loadLiveMode();
  });

  refreshButton?.addEventListener("click", async () => {
    if (currentState.token) {
      await loadLiveMode();
      return;
    }

    await loadFallbackMode("Showing sample JSON fallback queues.");
  });

  sampleButton?.addEventListener("click", async () => {
    sessionStorage.removeItem(SESSION_TOKEN_KEY);
    currentState.token = "";
    if (tokenInput) {
      tokenInput.value = "";
    }
    await loadFallbackMode("Showing sample JSON fallback queues.");
  });
}

async function loadFallbackMode(message) {
  renderLoading("Loading sample review queues...");
  currentState.sourceLabel = "Sample JSON fallback";
  currentState.collections = await loadCollectionsFromFallback();
  renderDashboard(currentState.collections, false);
  updateModeLabel("Sample fallback mode", "jw-badge jw-badge--pending-review");
  setFeedback(message, "neutral");
}

async function loadLiveMode() {
  renderLoading("Loading live D1 review queues...");
  try {
    const collections = await loadCollectionsFromApi(currentState.token);
    currentState.sourceLabel = "Live D1 data";
    currentState.collections = collections;
    renderDashboard(collections, true);
    updateModeLabel("Live D1 mode", "jw-badge jw-badge--approved");
    setFeedback("Live D1 review queues loaded.", "success");
  } catch (error) {
    console.warn("Falling back to sample review queues", error);
    await loadFallbackMode(error.message || "Could not load live review queues. Showing sample data instead.");
    setFeedback("Live review queues are unavailable. Showing sample JSON fallback.", "error");
  }
}

async function loadCollectionsFromApi(token) {
  const queueEntries = await Promise.all(
    LIVE_REVIEW_TYPES.map(async (item) => {
      const response = await fetch(`${item.path}?limit=50`, {
        headers: {
          "x-admin-token": token
        }
      });

      const data = await response.json().catch(() => ({}));
      if (!response.ok || data.ok !== true) {
        throw new Error(data.error || "Admin review API request failed.");
      }

      return [item.key, Array.isArray(data.items) ? data.items : []];
    })
  );

  const contentGapResponse = await fetch("/api/content-gaps?limit=30", {
    headers: {
      "x-admin-token": token
    }
  });
  const contentGapData = await contentGapResponse.json().catch(() => ({}));
  if (!contentGapResponse.ok || contentGapData.ok !== true) {
    throw new Error(contentGapData.error || "Content gaps API request failed.");
  }

  return Object.fromEntries([
    ...queueEntries,
    ["contentGaps", Array.isArray(contentGapData.items) ? contentGapData.items : []]
  ]);
}

async function loadCollectionsFromFallback() {
  const entries = await Promise.all(
    Object.entries(FALLBACK_FILES).map(async ([key, path]) => {
      try {
        const response = await fetch(path);
        const items = response.ok ? await response.json() : [];
        return [key, normalizeReviewCollection(items)];
      } catch (error) {
        console.warn("Review queue fallback failed for", path, error);
        return [key, []];
      }
    })
  );

  return Object.fromEntries(entries);
}

function normalizeReviewCollection(data) {
  if (Array.isArray(data)) {
    return data;
  }

  if (Array.isArray(data?.items)) {
    return data.items;
  }

  if (Array.isArray(data?.issues)) {
    return data.issues;
  }

  return [];
}

function renderLoading(text) {
  const dashboard = document.getElementById("admin-review-dashboard");
  if (dashboard) {
    dashboard.innerHTML = `<div class="jw-card p-5"><p class="m-0 text-sm text-stone-600">${escapeHtml(text)}</p></div>`;
  }
}

export function normalizeTitle(title) {
  return String(title || "")
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function simpleHash(text) {
  const value = String(text || "");
  let hash = 0;

  for (let index = 0; index < value.length; index += 1) {
    hash = (hash << 5) - hash + value.charCodeAt(index);
    hash |= 0;
  }

  return Math.abs(hash).toString(16);
}

export function groupByDuplicateGroupId(newsItems) {
  const groups = {};

  newsItems.forEach((item) => {
    const key = String(item.duplicate_group_id || "").trim();
    if (!key) {
      return;
    }

    if (!groups[key]) {
      groups[key] = [];
    }

    groups[key].push(item);
  });

  return groups;
}

export function findPotentialDuplicates(newsItems) {
  const matches = [];

  for (let index = 0; index < newsItems.length; index += 1) {
    for (let compare = index + 1; compare < newsItems.length; compare += 1) {
      const left = newsItems[index];
      const right = newsItems[compare];
      const reasons = [];

      if (left.canonical_url && left.canonical_url === right.canonical_url) {
        reasons.push("same canonical_url");
      }

      if (left.content_hash && left.content_hash === right.content_hash) {
        reasons.push("same content_hash");
      }

      if (left.duplicate_group_id && left.duplicate_group_id === right.duplicate_group_id) {
        reasons.push("same duplicate_group_id");
      }

      if (normalizeTitle(left.title || left.title_en) === normalizeTitle(right.title || right.title_en)) {
        reasons.push("same normalized title");
      }

      if (reasons.length) {
        matches.push({ left, right, reasons });
      }
    }
  }

  return matches;
}

function renderDashboard(collections, isLive) {
  const summaryRoot = document.getElementById("admin-review-summary");
  const sectionsRoot = document.getElementById("admin-review-dashboard");
  const sourceNode = document.getElementById("admin-source-label");

  if (!summaryRoot || !sectionsRoot) {
    return;
  }

  if (sourceNode) {
    sourceNode.textContent = currentState.sourceLabel;
  }

  const allItems = Object.values(collections).flat();
  const statusCounts = countByStatus(allItems);
  const duplicates = findPotentialDuplicates(collections.news || []);

  summaryRoot.innerHTML = `
    <div class="jw-admin-summary">
      ${STATUS_ORDER.map(
        (status) => `
          <article class="jw-card p-5">
            <span class="${buildStatusClass(status)}">${formatStatus(status)}</span>
            <h2 class="mt-3 text-3xl font-bold tracking-tight text-stone-900">${statusCounts[status] || 0}</h2>
            <p class="m-0 mt-2 text-sm text-stone-600">${formatStatus(status)} items</p>
          </article>
        `
      ).join("")}
    </div>
  `;

  sectionsRoot.innerHTML = [
    renderSection("Pending Community Members", "community", collections.community, isLive, {
      subtitle: "Private contact details remain masked in the admin preview."
    }),
    renderSection("Pending Corrections", "corrections", collections.corrections, isLive, {
      subtitle: "Review factual, temple, translation, and resource correction requests."
    }),
    renderSection("Pending News", "news", collections.news, isLive, {
      subtitle: "Includes review state, priority, source notes, and possible duplicate checks.",
      extraContent: renderDuplicatePanel(duplicates)
    }),
    renderSection("Pending Resources", "resources", collections.resources, isLive, {
      subtitle: "Watch for stale links, missing official sources, and needs-update items."
    }),
    renderSection("Calendar Review", "calendar-review", collections.calendarReview, false, {
      subtitle: "Review-first festival and tithi date placeholders must stay source-backed before any exact dates are shown publicly."
    }),
    renderSection("Calendar Quality", "calendar-quality", collections.calendarQuality, false, {
      subtitle: "Generated quality checks for missing sources, review status, duplicate slugs, and unsupported exact dates."
    }),
    renderSection("Community Directory Review", "community-directory", collections.communityDirectory, false, {
      subtitle: "Review-first placeholders for sanghs, centers, events, trusts, and institutional references."
    }),
    renderSection("Community Directory Quality", "community-directory-quality", collections.communityDirectoryQuality, false, {
      subtitle: "Generated quality signals for missing city, state, website, source, or review fields."
    }),
    renderSection("Speaker/Profile Review", "speakers-review", collections.speakersReview, false, {
      subtitle: "Speaker and lecture references remain placeholder-first until source and permission checks are complete."
    }),
    renderSection("Names Review", "names-review", collections.namesReview, false, {
      subtitle: "Simple name meanings should still be reviewed for spelling, nuance, and family preference."
    }),
    renderSection("Dictionary Review", "dictionary-review", collections.dictionaryReview, false, {
      subtitle: "Starter glossary entries are designed for beginners and still benefit from doctrinal nuance review."
    }),
    renderSection("External Resources Review", "external-resources-review", collections.externalResourcesReview, false, {
      subtitle: "Track future books, images, audio, calendar links, and references before any public publishing or hosting decision."
    }),
    renderSection("Source Permission Review", "source-permission-review", collections.sourcePermissionReview, false, {
      subtitle: "Flag missing source URLs, unclear licenses, and records that still need permission or attribution work."
    }),
    renderSection("Image Credits Review", "image-credits-review", collections.imageCreditsReview, false, {
      subtitle: "Review image attribution, creator notes, and whether placeholders or external visuals are safe to use."
    }),
    renderSection("Books Review", "books-review", collections.booksReview, false, {
      subtitle: "Books are metadata-first unless public domain or permission-received status is clearly documented."
    }),
    renderSection("Resource Quality Review", "resource-quality", collections.resourceQuality, false, {
      subtitle: "Track where official links, document notes, and verification warnings still need work."
    }),
    renderSection("Pending Audio", "audio", collections.audio, isLive, {
      subtitle: "Review permission status, source attribution, and speaker or singer metadata."
    }),
    renderSection("Ask Review Queue", "ask", collections.ask, isLive, {
      subtitle: "Questions with limited source coverage or higher safety sensitivity are queued here."
    }),
    renderContentGapSection(collections.contentGaps || []),
    renderSection("Pending Temple Corrections", "temple-corrections", collections.templeCorrections, isLive, {
      subtitle: "Review correction categories before pushing any temple detail changes."
    }),
    renderSection("Pending Images", "images", collections.images, isLive, {
      subtitle: "Review licensing, captions, alt text, and whether a photo or generated image is appropriate."
    }),
    renderSystemNotes(collections)
  ].join("");

  if (isLive) {
    bindReviewActionButtons();
  }
}

function renderContentGapSection(items = []) {
  const topItems = items.slice(0, 8);
  return `
    <section class="py-4">
      <div class="jw-section-title">
        <div>
          <span class="jw-kicker">Content Gaps</span>
          <h2 class="mt-3 text-2xl font-semibold tracking-tight text-stone-900">Content Gaps / Unanswered Questions</h2>
        </div>
        <span class="text-sm text-stone-500">${items.length} item(s)</span>
      </div>
      <p class="m-0 mb-4 text-sm leading-7 text-stone-600">Track repeated unanswered questions, weak source coverage, and opportunities for future content planning.</p>
      <div class="jw-grid-2">
        <article class="jw-card p-5">
          <div class="flex items-center justify-between gap-3">
            <h3 class="m-0 text-lg font-semibold text-stone-900">Latest unanswered themes</h3>
            <span class="jw-badge jw-badge--pending-review">${topItems.length}</span>
          </div>
          <div class="jw-admin-item mt-4">
            ${renderContentGapItems(topItems)}
          </div>
        </article>
        <article class="jw-card p-5">
          <div class="flex items-center justify-between gap-3">
            <h3 class="m-0 text-lg font-semibold text-stone-900">Highest frequency gaps</h3>
            <span class="jw-badge jw-badge--needs-update">${items.filter((item) => Number(item.frequency_count || 0) > 1).length}</span>
          </div>
          <div class="jw-admin-item mt-4">
            ${renderContentGapItems([...items].sort((a, b) => Number(b.frequency_count || 0) - Number(a.frequency_count || 0)).slice(0, 6), "No repeated gaps yet.")}
          </div>
        </article>
      </div>
    </section>
  `;
}

function renderContentGapItems(items = [], emptyText = "No content gaps are currently recorded.") {
  if (!items.length) {
    return `<p class="m-0 text-sm text-stone-600">${escapeHtml(emptyText)}</p>`;
  }

  return items
    .map(
      (item) => `
        <div>
          <div class="flex flex-wrap items-center gap-2">
            <span class="jw-badge jw-badge--pending-review">${escapeHtml(String(item.status || "open").replace(/_/g, " "))}</span>
            <span class="jw-badge jw-badge--draft">${escapeHtml(item.priority || "medium")}</span>
            ${item.detected_intent ? `<span class="jw-badge jw-badge--verified">${escapeHtml(item.detected_intent)}</span>` : ""}
          </div>
          <h4 class="m-0 mt-3 text-base font-semibold text-stone-900">${escapeHtml(item.question || "Untitled gap")}</h4>
          <p class="m-0 mt-2 text-sm leading-7 text-stone-600">${escapeHtml(item.missing_topic || "Source coverage is not yet strong enough for this topic.")}</p>
          <div class="jw-meta mt-3">
            <span>Sources: ${escapeHtml(String(item.source_count || 0))}</span>
            <span>Frequency: ${escapeHtml(String(item.frequency_count || 1))}</span>
            ${item.last_asked_at ? `<span>Last asked: ${escapeHtml(formatDate(item.last_asked_at))}</span>` : ""}
          </div>
        </div>
      `
    )
    .join("");
}

function renderSection(title, itemType, items = [], isLive = false, options = {}) {
  const subtitle = options.subtitle || "";
  const extraContent = options.extraContent || "";
  const priorityItems = items.filter((item) => String(item.priority || "").toLowerCase() === "high");
  const pendingItems = items.filter((item) => String(item.review_status || "").toLowerCase() === "pending_review");

  return `
    <section class="py-4">
      <div class="jw-section-title">
        <div>
          <span class="jw-kicker">${escapeHtml(title)}</span>
          <h2 class="mt-3 text-2xl font-semibold tracking-tight text-stone-900">${escapeHtml(title)}</h2>
        </div>
        <span class="text-sm text-stone-500">${items.length} item(s)</span>
      </div>
      ${subtitle ? `<p class="m-0 mb-4 text-sm leading-7 text-stone-600">${escapeHtml(subtitle)}</p>` : ""}
      <div class="jw-grid-2">
        <article class="jw-card p-5">
          <div class="flex items-center justify-between gap-3">
            <h3 class="m-0 text-lg font-semibold text-stone-900">Latest pending items</h3>
            <span class="${buildStatusClass("pending_review")}">${pendingItems.length}</span>
          </div>
          <div class="jw-admin-item mt-4">
            ${renderQueueItems(itemType, pendingItems.slice(0, 6), isLive)}
          </div>
        </article>
        <article class="jw-card p-5">
          <div class="flex items-center justify-between gap-3">
            <h3 class="m-0 text-lg font-semibold text-stone-900">High-priority review</h3>
            <span class="jw-badge jw-badge--needs-update">${priorityItems.length}</span>
          </div>
          <div class="jw-admin-item mt-4">
            ${renderQueueItems(itemType, priorityItems.slice(0, 6), isLive, "No high-priority items right now.")}
          </div>
        </article>
      </div>
      ${extraContent}
    </section>
  `;
}

function renderQueueItems(itemType, items = [], isLive = false, emptyText = "No items are waiting in this queue.") {
  if (!items.length) {
    return `<p class="m-0 text-sm text-stone-600">${escapeHtml(emptyText)}</p>`;
  }

  return items
    .map((item) => {
      const title = item.title || item.title_en || item.summary || item.id || "Untitled";
      const summary = item.summary || item.summary_en || item.description || "No summary provided.";
      const sourceUrl = item.source_url || item.official_url || "";
      const maskedContact = item.masked_contact || buildMaskedContact(item);

      return `
        <div>
          <div class="flex flex-wrap items-center gap-2">
            <span class="${buildStatusClass(item.review_status)}">${formatStatus(item.review_status)}</span>
            <span class="jw-badge jw-badge--draft">${escapeHtml(item.priority || "low")}</span>
            ${item.status ? `<span class="jw-badge jw-badge--published">${escapeHtml(item.status)}</span>` : ""}
            ${item.safety_level ? `<span class="${String(item.safety_level).toLowerCase() === "high_review" ? "jw-badge jw-badge--needs-update" : "jw-badge jw-badge--verified"}">${escapeHtml(String(item.safety_level).toLowerCase() === "high_review" ? "High risk" : "Normal risk")}</span>` : ""}
          </div>
          <h4 class="m-0 mt-3 text-base font-semibold text-stone-900">${escapeHtml(title)}</h4>
          <p class="m-0 mt-2 text-sm leading-7 text-stone-600">${escapeHtml(summary)}</p>
          <div class="jw-meta mt-3">
            ${item.created_at ? `<span>Created: ${escapeHtml(formatDate(item.created_at))}</span>` : ""}
            ${item.last_checked_at ? `<span>Checked: ${escapeHtml(formatDate(item.last_checked_at))}</span>` : ""}
            ${item.submitted_by ? `<span>Submitted by: ${escapeHtml(item.submitted_by)}</span>` : ""}
            ${item.submitted_by_name ? `<span>Submitted by: ${escapeHtml(item.submitted_by_name)}</span>` : ""}
            ${maskedContact ? `<span>Contact: ${escapeHtml(maskedContact)}</span>` : ""}
          </div>
          ${item.admin_notes ? `<p class="m-0 mt-2 text-sm text-stone-500"><strong>Notes:</strong> ${escapeHtml(item.admin_notes)}</p>` : ""}
          ${item.risk_notes ? `<p class="m-0 mt-2 text-sm text-stone-500"><strong>Risk:</strong> ${escapeHtml(item.risk_notes)}</p>` : ""}
          ${sourceUrl ? `<p class="m-0 mt-2 text-sm"><a class="text-amber-800 hover:text-amber-900" href="${escapeHtml(sourceUrl)}" target="_blank" rel="noopener noreferrer">Open source link</a></p>` : ""}
          ${
            isLive
              ? `<div class="mt-4 flex flex-wrap gap-2">
                  <button type="button" class="jw-btn jw-btn-primary" data-review-action="approve" data-item-type="${escapeHtml(itemType)}" data-item-id="${escapeHtml(item.id)}">Approve</button>
                  <button type="button" class="jw-btn" data-review-action="reject" data-item-type="${escapeHtml(itemType)}" data-item-id="${escapeHtml(item.id)}">Reject</button>
                  <button type="button" class="jw-btn" data-review-action="needs_update" data-item-type="${escapeHtml(itemType)}" data-item-id="${escapeHtml(item.id)}">Needs Update</button>
                  <button type="button" class="jw-btn" data-review-action="archive" data-item-type="${escapeHtml(itemType)}" data-item-id="${escapeHtml(item.id)}">Archive</button>
                </div>`
              : ""
          }
        </div>
      `;
    })
    .join("");
}

function renderDuplicatePanel(duplicates) {
  return `
    <div class="jw-card mt-4 p-5">
      <div class="flex items-center justify-between gap-3">
        <h3 class="m-0 text-lg font-semibold text-stone-900">Possible duplicate stories</h3>
        <span class="jw-badge jw-badge--pending-review">${duplicates.length}</span>
      </div>
      <div class="jw-admin-item mt-4">
        ${
          duplicates.length
            ? duplicates
                .slice(0, 5)
                .map(
                  (pair) => `
                    <div>
                      <p class="m-0 text-sm font-semibold text-stone-900">${escapeHtml(pair.left.title || pair.left.title_en || "Untitled")} <span class="text-stone-500">vs</span> ${escapeHtml(pair.right.title || pair.right.title_en || "Untitled")}</p>
                      <p class="m-0 mt-2 text-sm text-stone-600">Possible duplicate because: ${escapeHtml(pair.reasons.join(", "))}</p>
                    </div>
                  `
                )
                .join("")
            : `<p class="m-0 text-sm text-stone-600">No duplicate signals found in the current queue.</p>`
        }
      </div>
    </div>
  `;
}

function renderSystemNotes(collections) {
  const needsUpdateResources = (collections.resources || []).filter(
    (item) => String(item.review_status || "").toLowerCase() === "needs_update"
  );
  const pendingPermissions = (collections.audio || []).filter((item) =>
    ["needs_review", "rejected_copyright"].includes(String(item.permission_status || "").toLowerCase())
  );

  return `
    <section class="py-4">
      <div class="jw-section-title">
        <div>
          <span class="jw-kicker">System Notes</span>
          <h2 class="mt-3 text-2xl font-semibold tracking-tight text-stone-900">Operational notes and next actions</h2>
        </div>
      </div>
      <div class="jw-grid-3">
        <article class="jw-card p-5">
          <h3 class="m-0 text-lg font-semibold text-stone-900">Needs-update resources</h3>
          <p class="m-0 mt-3 text-sm leading-7 text-stone-600">${needsUpdateResources.length} resource item(s) are marked as needs update and should be rechecked against official sources.</p>
        </article>
        <article class="jw-card p-5">
          <h3 class="m-0 text-lg font-semibold text-stone-900">Audio permissions</h3>
          <p class="m-0 mt-3 text-sm leading-7 text-stone-600">${pendingPermissions.length} audio item(s) need permission or copyright review before broader use.</p>
        </article>
        <article class="jw-card p-5">
          <h3 class="m-0 text-lg font-semibold text-stone-900">Community privacy</h3>
          <p class="m-0 mt-3 text-sm leading-7 text-stone-600">Do not expose raw contact data publicly. Future admin tools should keep all review queues behind authentication.</p>
        </article>
      </div>
    </section>
  `;
}

function bindReviewActionButtons() {
  document.querySelectorAll("[data-review-action]").forEach((button) => {
    if (button.dataset.bound === "true") {
      return;
    }

    button.dataset.bound = "true";
    button.addEventListener("click", async () => {
      const action = button.getAttribute("data-review-action");
      const itemType = button.getAttribute("data-item-type");
      const itemId = button.getAttribute("data-item-id");
      const token = currentState.token;

      if (!token) {
        setFeedback("Admin token is required for review actions.", "error");
        return;
      }

      button.disabled = true;
      try {
        const response = await fetch("/api/review-action", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-admin-token": token
          },
          body: JSON.stringify({
            item_type: itemType,
            item_id: itemId,
            action,
            notes: ""
          })
        });

        const data = await response.json().catch(() => ({}));
        if (!response.ok || data.ok !== true) {
          throw new Error(data.error || "Could not save review action.");
        }

        setFeedback("Review action saved.", "success");
        await loadLiveMode();
      } catch (error) {
        setFeedback(error.message || "Could not save review action.", "error");
      } finally {
        button.disabled = false;
      }
    });
  });
}

function setFeedback(text, tone = "neutral") {
  const node = document.getElementById("admin-review-feedback");
  if (!node) {
    return;
  }

  const styles = {
    neutral: "mt-4 rounded-xl border border-stone-200 bg-stone-50 px-4 py-3 text-sm text-stone-600",
    success: "mt-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900",
    error: "mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
  };

  node.textContent = text;
  node.className = styles[tone] || styles.neutral;
}

function updateModeLabel(text, className) {
  const node = document.getElementById("admin-mode-label");
  if (!node) {
    return;
  }

  node.textContent = text;
  node.className = className;
}

function buildStatusClass(status) {
  const key = String(status || "draft").trim().toLowerCase().replace(/_/g, "-");
  return `jw-badge jw-badge--${key}`;
}

function countByStatus(items) {
  return items.reduce((totals, item) => {
    const key = String(item.review_status || item.status || "draft").trim().toLowerCase();
    totals[key] = (totals[key] || 0) + 1;

    if (item.status) {
      const statusKey = String(item.status).trim().toLowerCase();
      totals[statusKey] = (totals[statusKey] || 0) + 1;
    }

    return totals;
  }, {});
}

function formatStatus(status) {
  return String(status || "draft")
    .replace(/_/g, " ")
    .replace(/\b\w/g, (character) => character.toUpperCase());
}

function formatDate(value) {
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

function buildMaskedContact(item) {
  const parts = [item.masked_mobile || maskPhone(item.mobile), item.masked_email || maskEmail(item.email)].filter(Boolean);
  return parts.join(" | ");
}

export function maskEmail(email) {
  const value = String(email || "").trim();
  if (!value || !value.includes("@")) {
    return "";
  }

  const [localPart, domainPart] = value.split("@");
  if (!localPart || !domainPart) {
    return value;
  }

  if (localPart.length <= 2) {
    return `${localPart[0] || "*"}***@${domainPart}`;
  }

  return `${localPart.slice(0, 2)}***@${domainPart}`;
}

export function maskPhone(phone) {
  const value = String(phone || "").trim();
  const digits = value.replace(/\D/g, "");

  if (!digits) {
    return "";
  }

  if (digits.length <= 4) {
    return value;
  }

  const prefix = digits.slice(0, Math.min(2, digits.length - 2));
  const suffix = digits.slice(-2);
  return `${prefix}${"X".repeat(Math.max(4, digits.length - prefix.length - suffix.length))}${suffix}`;
}

function escapeHtml(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}
