const fs = require("fs");
const path = require("path");

const rootDir = path.resolve(__dirname, "..", "..");
const reportPath = path.join(rootDir, "tools", "reports", "onlinejainpathshala-review-report.json");
const qualityPath = path.join(rootDir, "public", "data", "review-onlinejainpathshala-quality.json");

const INPUTS = {
  pages: "public/data/review-onlinejainpathshala-pages.json",
  assets: "public/data/review-onlinejainpathshala-assets.json",
  books: "public/data/review-onlinejainpathshala-books.json",
  audio: "public/data/review-onlinejainpathshala-audio.json",
  images: "public/data/review-onlinejainpathshala-images.json",
  pathshala: "public/data/review-onlinejainpathshala-pathshala.json",
  calendar: "public/data/review-onlinejainpathshala-calendar.json",
  panchang: "public/data/panchang-2026.json",
  extractionQueue: "public/data/review-calendar-extraction-queue.json",
  permissions: "public/data/source-permissions.json"
};

function main() {
  ensureDir(path.dirname(reportPath));

  const collections = Object.fromEntries(
    Object.entries(INPUTS).map(([key, relativePath]) => [key, readArray(relativePath)])
  );

  const issues = [];
  const seenUrls = new Set();

  checkReviewRecords(collections.pages, "pages", issues, seenUrls);
  checkReviewRecords(collections.assets, "assets", issues, seenUrls);
  checkReviewRecords(collections.books, "books", issues, seenUrls);
  checkReviewRecords(collections.audio, "audio", issues, seenUrls);
  checkReviewRecords(collections.images, "images", issues, seenUrls);
  checkReviewRecords(collections.pathshala, "pathshala", issues, seenUrls);
  checkReviewRecords(collections.calendar, "calendar", issues, seenUrls);
  checkPanchang(collections.panchang, issues);
  checkExtractionQueue(collections.extractionQueue, issues);
  checkPermissionManifest(collections.permissions, issues);

  const summary = buildSummary(collections, issues);
  const report = {
    generated_at: new Date().toISOString(),
    summary,
    issues
  };

  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2), "utf8");
  fs.writeFileSync(qualityPath, JSON.stringify(report, null, 2), "utf8");

  console.log(`Wrote ${reportPath}`);
  console.log(`Wrote ${qualityPath}`);
}

function readArray(relativePath) {
  const fullPath = path.join(rootDir, relativePath);
  if (!fs.existsSync(fullPath)) {
    return [];
  }
  try {
    const data = JSON.parse(fs.readFileSync(fullPath, "utf8"));
    return Array.isArray(data) ? data : [];
  } catch (error) {
    return [];
  }
}

function checkReviewRecords(items, type, issues, seenUrls) {
  items.forEach((item) => {
    const url = String(item.url || item.source_url || item.page_url || "").trim();
    if (!item.source_url && type !== "assets") {
      issues.push(issue(type, item.id, "missing_source_url", "Source URL is required for review-first external records."));
    }
    if (!item.attribution_text) {
      issues.push(issue(type, item.id, "missing_attribution_text", "Attribution text is required before using external material."));
    }
    if (!item.permission_status) {
      issues.push(issue(type, item.id, "missing_permission_status", "Permission status is missing."));
    }
    if (!item.license_status) {
      issues.push(issue(type, item.id, "missing_license_status", "License status is missing."));
    }
    if (!item.review_status) {
      issues.push(issue(type, item.id, "missing_review_status", "Review status is missing."));
    }
    if (url) {
      if (seenUrls.has(url)) {
        issues.push(issue(type, item.id, "duplicate_url", `Duplicate URL detected: ${url}`));
      }
      seenUrls.add(url);
      if (/(login|signup|member|classified|matrimonial|forum|contact-us\?)/i.test(url)) {
        issues.push(issue(type, item.id, "private_or_sensitive_url", "Review queue includes a URL that may expose login, form, or sensitive user-content areas."));
      }
    }
    if ((type === "audio" || type === "assets") && item.downloaded === true) {
      issues.push(issue(type, item.id, "download_attempted", "Audio or asset download should not happen automatically in this workflow."));
    }
    if (type === "assets" && Number(item.size_bytes || 0) > 50 * 1024 * 1024) {
      issues.push(issue(type, item.id, "oversized_asset", "Asset exceeds the safe intake threshold."));
    }
    if (!item.destination_mapping && type === "pages") {
      issues.push(issue(type, item.id, "missing_destination_mapping", "Discovered page is missing a JainWorld destination mapping."));
    }
  });
}

function checkPanchang(items, issues) {
  if (!items.length) {
    issues.push(issue("panchang", "archive", "missing_archive_dataset", "Panchang archive dataset is missing."));
    return;
  }

  items.forEach((item) => {
    if (!item.credit_text) {
      issues.push(issue("panchang", item.id, "missing_credit", "Panchang record is missing visible source credit."));
    }
    if (!item.source_url) {
      issues.push(issue("panchang", item.id, "missing_source_url", "Panchang record needs a source URL."));
    }
    if (!item.permission_status) {
      issues.push(issue("panchang", item.id, "missing_permission_status", "Panchang record needs a permission status."));
    }
    if (!item.image_url && !item.expected_image_url && item.asset_type !== "pdf") {
      issues.push(issue("panchang", item.id, "missing_panchang_image", "Panchang month record has no current or expected image path."));
    }
  });
}

function checkExtractionQueue(items, issues) {
  if (!items.length) {
    issues.push(issue("extractionQueue", "queue", "missing_extraction_queue", "Panchang extraction queue is missing."));
    return;
  }
}

function checkPermissionManifest(items, issues) {
  const manifest = items.find((item) => item.id === "onlinejainpathshala-amar-granthalaya");
  if (!manifest) {
    issues.push(issue("permissions", "onlinejainpathshala-amar-granthalaya", "missing_source_permission_manifest", "Source permission manifest record is missing."));
  }
}

function buildSummary(collections, issues) {
  const blockedItems = issues.filter((item) =>
    ["private_or_sensitive_url", "download_attempted", "missing_source_permission_manifest"].includes(item.code)
  ).length;
  const permissionIssues = issues.filter((item) => /permission|license|attribution|source_url/.test(item.code)).length;
  const privateContentRisks = issues.filter((item) => item.code === "private_or_sensitive_url").length;

  return {
    pages_total: collections.pages.length,
    assets_total: collections.assets.length,
    books_total: collections.books.length,
    audio_total: collections.audio.length,
    images_total: collections.images.length,
    pathshala_total: collections.pathshala.length,
    calendar_total: collections.calendar.length,
    permission_issues: permissionIssues,
    private_content_risks: privateContentRisks,
    ready_for_manual_review: Math.max(0, collections.pages.length + collections.assets.length - blockedItems),
    blocked_items: blockedItems
  };
}

function issue(type, id, code, message) {
  return { type, id, code, message };
}

function ensureDir(dirPath) {
  fs.mkdirSync(dirPath, { recursive: true });
}

main();
