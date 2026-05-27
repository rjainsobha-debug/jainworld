const fs = require("fs");
const path = require("path");

const rootDir = path.resolve(__dirname, "..", "..");
const dataDir = path.join(rootDir, "public", "data");
const reportDir = path.join(rootDir, "tools", "reports");

const booksPath = path.join(dataDir, "sample-books.json");
const externalReviewPath = path.join(dataDir, "review-external-resources.json");
const imageCreditsPath = path.join(dataDir, "sample-image-credits.json");
const audioPath = path.join(dataDir, "sample-audio.json");
const reportPath = path.join(reportDir, "source-permission-review-report.json");
const publicQualityPath = path.join(dataDir, "review-source-permissions.json");

main();

function main() {
  ensureDir(reportDir);

  const books = readArray(booksPath);
  const externalResources = readArray(externalReviewPath);
  const imageCredits = readArray(imageCreditsPath);
  const audioItems = readArray(audioPath);
  const findings = [];

  books.forEach((item) => validateBook(item, findings));
  externalResources.forEach((item) => validateExternalResource(item, findings));
  imageCredits.forEach((item) => validateImageCredit(item, findings));
  audioItems.forEach((item) => validateAudio(item, findings));

  const quality = {
    summary: {
      total_records: books.length + externalResources.length + imageCredits.length + audioItems.length,
      books_count: books.length,
      external_resources_count: externalResources.length,
      image_credits_count: imageCredits.length,
      audio_count: audioItems.length,
      issues_count: findings.length
    },
    issues: findings
  };

  const report = {
    generated_at: new Date().toISOString(),
    files_reviewed: [
      relativePath(booksPath),
      relativePath(externalReviewPath),
      relativePath(imageCreditsPath),
      relativePath(audioPath)
    ],
    quality
  };

  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2), "utf8");
  fs.writeFileSync(publicQualityPath, JSON.stringify(quality, null, 2), "utf8");
  console.log(`Wrote ${reportPath}`);
  console.log(`Wrote ${publicQualityPath}`);
}

function validateBook(item, findings) {
  const slug = keyFor(item);
  requireField(findings, "book_missing_license_status", slug, item.license_status, "Book metadata is missing license_status.");
  requireField(findings, "book_missing_review_status", slug, item.review_status, "Book metadata is missing review_status.");
  requireField(findings, "book_missing_source_name", slug, item.source_name, "Book metadata is missing source_name.");

  if (item.source_name && !item.source_url && item.external_link_only) {
    findings.push(issue("book_missing_source_url", slug, "External-link-only book record is missing source_url."));
  }

  if (item.hosting_allowed === true && !["permission_received", "public_domain", "original"].includes(String(item.license_status || "").toLowerCase())) {
    findings.push(issue("book_hosting_without_clear_permission", slug, "Book hosting is allowed without a clear public-domain or permission-received license status."));
  }

  if (!item.attribution_text) {
    findings.push(issue("book_missing_attribution", slug, "Book metadata is missing attribution_text."));
  }
}

function validateExternalResource(item, findings) {
  const slug = keyFor(item);
  requireField(findings, "external_missing_license_status", slug, item.license_status, "External review item is missing license_status.");
  requireField(findings, "external_missing_permission_status", slug, item.permission_status, "External review item is missing permission_status.");
  requireField(findings, "external_missing_source_name", slug, item.source_name, "External review item is missing source_name.");

  if ((item.proposed_use === "link_only" || item.proposed_use === "embed" || item.proposed_use === "host_file") && !item.source_url) {
    findings.push(issue("external_missing_source_url", slug, "External review item needs source_url for the proposed use."));
  }

  if (!item.attribution_text) {
    findings.push(issue("external_missing_attribution", slug, "External review item is missing attribution_text."));
  }
}

function validateImageCredit(item, findings) {
  const slug = keyFor(item);
  requireField(findings, "image_missing_permission_status", slug, item.permission_status, "Image credit record is missing permission_status.");

  if (item.image_url && !item.license_name) {
    findings.push(issue("image_missing_license_name", slug, "External image credit is missing license_name."));
  }

  if (item.image_url && !item.source_url) {
    findings.push(issue("image_missing_source_url", slug, "External image credit is missing source_url."));
  }

  if (item.image_url && !item.attribution_text) {
    findings.push(issue("image_missing_attribution", slug, "External image credit is missing attribution_text."));
  }
}

function validateAudio(item, findings) {
  const slug = keyFor(item);
  if ((item.audio_url || item.embed_url || item.source_url) && !item.permission_status) {
    findings.push(issue("audio_missing_permission_status", slug, "Audio record has an external source but permission_status is missing."));
  }

  if ((item.audio_url || item.embed_url || item.source_url) && !item.license_status) {
    findings.push(issue("audio_missing_license_status", slug, "Audio record has an external source but license_status is missing."));
  }

  if (String(item.permission_status || "").toLowerCase() === "allowed" && !item.attribution_text) {
    findings.push(issue("audio_missing_attribution", slug, "Audio record is allowed but attribution_text is missing."));
  }
}

function requireField(findings, code, slug, value, message) {
  if (!String(value || "").trim()) {
    findings.push(issue(code, slug, message));
  }
}

function issue(code, slug, message) {
  return {
    code,
    slug,
    message
  };
}

function keyFor(item) {
  return String(item.slug || item.id || item.title || item.image_path || item.name || "(unknown)").trim();
}

function readArray(filePath) {
  if (!fs.existsSync(filePath)) {
    return [];
  }

  const data = JSON.parse(fs.readFileSync(filePath, "utf8"));
  return Array.isArray(data) ? data : [];
}

function ensureDir(dirPath) {
  fs.mkdirSync(dirPath, { recursive: true });
}

function relativePath(filePath) {
  return path.relative(rootDir, filePath).replace(/\\/g, "/");
}
