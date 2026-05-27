const fs = require("fs");
const path = require("path");

const rootDir = path.resolve(__dirname, "..", "..");
const dataDir = path.join(rootDir, "public", "data");
const reportDir = path.join(rootDir, "tools", "reports");

const samplePath = path.join(dataDir, "sample-calendar.json");
const reviewPath = path.join(dataDir, "review-calendar-events.json");
const sourcesPath = path.join(dataDir, "calendar-sources.json");
const reportPath = path.join(reportDir, "calendar-review-report.json");
const publicQualityPath = path.join(dataDir, "review-calendar-quality.json");

main();

function main() {
  ensureDir(reportDir);

  const sampleItems = readArray(samplePath);
  const reviewItems = readArray(reviewPath);
  const sources = readArray(sourcesPath);
  const allItems = [...sampleItems, ...reviewItems];
  const sourceNames = new Set(sources.map((item) => String(item.source_name || "").trim()).filter(Boolean));
  const slugCounts = countDuplicates(allItems.map((item) => item.slug));
  const findings = [];

  allItems.forEach((item) => validateItem(item, sourceNames, slugCounts, findings));

  const quality = {
    summary: {
      total_records: allItems.length,
      sample_records: sampleItems.length,
      review_records: reviewItems.length,
      source_records: sources.length,
      needs_review_count: allItems.filter((item) => String(item.date_confidence || "").toLowerCase() === "needs_review").length,
      educational_only_count: allItems.filter((item) => String(item.date_confidence || "").toLowerCase() === "educational_only").length,
      issues_count: findings.length
    },
    issues: findings
  };

  const report = {
    generated_at: new Date().toISOString(),
    files_reviewed: [relativePath(samplePath), relativePath(reviewPath), relativePath(sourcesPath)],
    quality
  };

  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2), "utf8");
  fs.writeFileSync(publicQualityPath, JSON.stringify(quality, null, 2), "utf8");
  console.log(`Wrote ${reportPath}`);
  console.log(`Wrote ${publicQualityPath}`);
}

function validateItem(item, sourceNames, slugCounts, findings) {
  const slug = String(item.slug || "").trim();
  const title = String(item.title || "").trim();
  const titleHi = String(item.title_hi || "").trim();
  const confidence = String(item.date_confidence || "").trim().toLowerCase();
  const reviewStatus = String(item.review_status || "").trim().toLowerCase();
  const sourceName = String(item.source_name || "").trim();
  const sourceUrl = String(item.source_url || "").trim();
  const sourceNote = String(item.source_note || "").trim();
  const lastVerified = String(item.last_verified_at || "").trim();
  const cautionNote = String(item.caution_note || "").trim();
  const traditionScope = String(item.tradition_scope || "").trim();
  const locationScope = String(item.location_scope || "").trim();

  if (!title) {
    findings.push(issue("missing_title", slug, "Calendar record is missing title."));
  }

  if (!titleHi) {
    findings.push(issue("missing_title_hi", slug, "Calendar record is missing title_hi."));
  }

  if (!confidence) {
    findings.push(issue("missing_date_confidence", slug, "Calendar record is missing date_confidence."));
  }

  if (!reviewStatus) {
    findings.push(issue("missing_review_status", slug, "Calendar record is missing review_status."));
  }

  if (slug && slugCounts.get(slug) > 1) {
    findings.push(issue("duplicate_slug", slug, "Calendar slug is duplicated across records."));
  }

  if (item.date_gregorian && !sourceName && !sourceUrl && !sourceNote) {
    findings.push(issue("exact_date_without_source", slug, "Exact Gregorian date exists without source_name, source_url, or source_note."));
  }

  if (sourceName && !sourceUrl && !sourceNote) {
    findings.push(issue("source_without_url_or_note", slug, "Calendar source_name exists without source_url or source_note."));
  }

  if (sourceName && sourceNames.size && !sourceNames.has(sourceName)) {
    findings.push(issue("source_name_not_listed", slug, "Calendar source_name is not listed in calendar-sources.json."));
  }

  if (confidence === "verified" && !lastVerified) {
    findings.push(issue("verified_missing_last_verified_at", slug, "Verified date is missing last_verified_at."));
  }

  if (!item.date_gregorian && !["educational_only", "needs_review"].includes(confidence)) {
    findings.push(issue("null_date_invalid_confidence", slug, "Null dates should normally be marked educational_only or needs_review."));
  }

  if (item.date_gregorian && confidence === "educational_only") {
    findings.push(issue("educational_with_exact_date", slug, "Educational-only record should not carry an exact date."));
  }

  if (!cautionNote) {
    findings.push(issue("missing_caution_note", slug, "Calendar record is missing caution_note."));
  }

  if (!traditionScope) {
    findings.push(issue("missing_tradition_scope", slug, "Calendar record is missing tradition_scope."));
  }

  if (!locationScope) {
    findings.push(issue("missing_location_scope", slug, "Calendar record is missing location_scope."));
  }

  if (item.date_gregorian && traditionScope === "general" && locationScope === "global" && confidence === "verified") {
    findings.push(issue("possible_universal_date_claim", slug, "Record looks like a universal exact date claim. Review tradition and location scope carefully."));
  }
}

function issue(code, slug, message) {
  return {
    code,
    slug: slug || "(missing-slug)",
    message
  };
}

function countDuplicates(values) {
  const counts = new Map();
  values
    .map((value) => String(value || "").trim())
    .filter(Boolean)
    .forEach((value) => {
      counts.set(value, (counts.get(value) || 0) + 1);
    });
  return counts;
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
