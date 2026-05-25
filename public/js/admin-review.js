console.log("Admin review loaded");

// TODO: When authenticated backend review APIs are enabled, try `/api/review/{type}`
// first and keep these static JSON files as a safe fallback for local preview.

const REVIEW_FILES = [
  { key: "news", path: "/data/review-news.json", title: "Pending News" },
  { key: "resources", path: "/data/review-resources.json", title: "Pending Resources" },
  { key: "audio", path: "/data/review-audio.json", title: "Pending Audio" },
  { key: "templeCorrections", path: "/data/review-temple-corrections.json", title: "Pending Temple Corrections" },
  { key: "community", path: "/data/review-community.json", title: "Pending Community Members" },
  { key: "images", path: "/data/review-images.json", title: "Pending Images" }
];

const STATUS_ORDER = [
  "pending_review",
  "approved",
  "verified",
  "needs_update",
  "rejected",
  "published",
  "draft",
  "archived"
];

document.addEventListener("DOMContentLoaded", async () => {
  if (document.body.dataset.page !== "admin-review") {
    return;
  }

  const dashboard = document.getElementById("admin-review-dashboard");
  if (!dashboard) {
    return;
  }

  dashboard.innerHTML = `<div class="jw-card p-5"><p class="m-0 text-sm text-stone-600">Loading review queues...</p></div>`;

  const collections = await loadCollections();
  renderDashboard(collections);
});

async function loadCollections() {
  const entries = await Promise.all(
    REVIEW_FILES.map(async (file) => {
      try {
        const response = await fetch(file.path);
        const items = response.ok ? await response.json() : [];
        return [file.key, Array.isArray(items) ? items : []];
      } catch (error) {
        console.warn("Review queue fallback failed for", file.path, error);
        return [file.key, []];
      }
    })
  );

  return Object.fromEntries(entries);
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
        matches.push({
          left,
          right,
          reasons
        });
      }
    }
  }

  return matches;
}

function renderDashboard(collections) {
  const summaryRoot = document.getElementById("admin-review-summary");
  const sectionsRoot = document.getElementById("admin-review-dashboard");

  if (!sectionsRoot || !summaryRoot) {
    return;
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
    renderSection("Pending News", collections.news, {
      subtitle: "Includes review state, priority, source notes, and possible duplicate checks.",
      extraContent: renderDuplicatePanel(duplicates)
    }),
    renderSection("Pending Resources", collections.resources, {
      subtitle: "Watch for stale links, missing official sources, and needs-update items."
    }),
    renderSection("Pending Audio", collections.audio, {
      subtitle: "Review permission status, source attribution, and speaker or singer metadata."
    }),
    renderSection("Pending Temple Corrections", collections.templeCorrections, {
      subtitle: "Review correction categories before pushing any temple detail changes."
    }),
    renderSection("Pending Community Members", collections.community, {
      subtitle: "Private contact details should remain masked in any public-facing workflow."
    }),
    renderSection("Pending Images", collections.images, {
      subtitle: "Review licensing, captions, alt text, and whether a photo or generated image is appropriate."
    }),
    renderSystemNotes(collections)
  ].join("");
}

function renderSection(title, items = [], options = {}) {
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
            ${renderQueueItems(items.slice(0, 4))}
          </div>
        </article>
        <article class="jw-card p-5">
          <div class="flex items-center justify-between gap-3">
            <h3 class="m-0 text-lg font-semibold text-stone-900">High-priority review</h3>
            <span class="jw-badge jw-badge--needs-update">${priorityItems.length}</span>
          </div>
          <div class="jw-admin-item mt-4">
            ${renderQueueItems(priorityItems.slice(0, 4), "No high-priority items right now.")}
          </div>
        </article>
      </div>
      ${extraContent}
    </section>
  `;
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
            : `<p class="m-0 text-sm text-stone-600">No duplicate signals found in the current sample queue.</p>`
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

function renderQueueItems(items = [], emptyText = "No items are waiting in this queue.") {
  if (!items.length) {
    return `<p class="m-0 text-sm text-stone-600">${escapeHtml(emptyText)}</p>`;
  }

  return items
    .map((item) => {
      const title = item.title || item.title_en || item.summary || item.id || "Untitled";
      const summary = item.summary || item.summary_en || "No summary provided.";
      const sourceUrl = item.source_url || item.official_url || "";
      const maskedContact = item.masked_contact || buildMaskedContact(item);

      return `
        <div>
          <div class="flex flex-wrap items-center gap-2">
            <span class="${buildStatusClass(item.review_status)}">${formatStatus(item.review_status)}</span>
            <span class="jw-badge jw-badge--draft">${escapeHtml(item.priority || "low")}</span>
            ${item.published ? '<span class="jw-badge jw-badge--published">Published</span>' : ""}
          </div>
          <h4 class="m-0 mt-3 text-base font-semibold text-stone-900">${escapeHtml(title)}</h4>
          <p class="m-0 mt-2 text-sm leading-7 text-stone-600">${escapeHtml(summary)}</p>
          <div class="jw-meta mt-3">
            ${item.created_at ? `<span>Created: ${escapeHtml(formatDate(item.created_at))}</span>` : ""}
            ${item.last_checked_at ? `<span>Checked: ${escapeHtml(formatDate(item.last_checked_at))}</span>` : ""}
            ${item.submitted_by ? `<span>Submitted by: ${escapeHtml(item.submitted_by)}</span>` : ""}
            ${maskedContact ? `<span>Contact: ${escapeHtml(maskedContact)}</span>` : ""}
          </div>
          ${item.admin_notes ? `<p class="m-0 mt-2 text-sm text-stone-500"><strong>Notes:</strong> ${escapeHtml(item.admin_notes)}</p>` : ""}
          ${item.risk_notes ? `<p class="m-0 mt-2 text-sm text-stone-500"><strong>Risk:</strong> ${escapeHtml(item.risk_notes)}</p>` : ""}
          ${sourceUrl ? `<p class="m-0 mt-2 text-sm"><a class="text-amber-800 hover:text-amber-900" href="${escapeHtml(sourceUrl)}" target="_blank" rel="noopener noreferrer">Open source link</a></p>` : ""}
        </div>
      `;
    })
    .join("");
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
  const parts = [maskPhone(item.mobile), maskEmail(item.email)].filter(Boolean);
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
