const fs = require("fs");
const path = require("path");

const rootDir = path.resolve(__dirname, "..", "..");
const dataDir = path.join(rootDir, "public", "data");
const reportDir = path.join(rootDir, "tools", "reports");

const paths = {
  sample: path.join(dataDir, "sample-calendar.json"),
  review: path.join(dataDir, "review-calendar-events.json"),
  sources: path.join(dataDir, "calendar-sources.json"),
  digital: path.join(dataDir, "panchang-digital-2026.json"),
  manual: path.join(dataDir, "review-panchang-manual-extraction.json"),
  ocr: path.join(dataDir, "review-panchang-ocr-extraction.json"),
  quality: path.join(dataDir, "review-calendar-quality.json"),
  report: path.join(reportDir, "calendar-review-report.json")
};

main();

function main() {
  ensureDir(reportDir);

  const sampleItems = readArray(paths.sample);
  const reviewItems = readArray(paths.review);
  const sources = readArray(paths.sources);
  const digital = readJson(paths.digital) || { months: [] };
  const manualQueue = readArray(paths.manual);
  const ocrQueue = readArray(paths.ocr);
  const months = Array.isArray(digital.months) ? digital.months : [];
  const digitalDays = months.flatMap((month) => Array.isArray(month.days) ? month.days.map((day) => ({ ...day, month_number: month.month_number, month_name: month.month_name })) : []);
  const digitalDayIds = countDuplicates(digitalDays.map((day) => day.id || day.gregorian_date));
  const allItems = [...sampleItems, ...reviewItems];
  const sourceNames = new Set(sources.map((item) => String(item.source_name || "").trim()).filter(Boolean));
  const slugCounts = countDuplicates(allItems.map((item) => item.slug));
  const findings = [];

  allItems.forEach((item) => validateLegacyItem(item, sourceNames, slugCounts, findings));
  months.forEach((month) => validateMonth(month, findings));
  digitalDays.forEach((day) => validateDigitalDay(day, findings));
  manualQueue.forEach((item) => validateManualQueue(item, findings));
  ocrQueue.forEach((item) => validateOcrQueue(item, findings));

  const quality = {
    summary: {
      total_records: allItems.length,
      sample_records: sampleItems.length,
      review_records: reviewItems.length,
      source_records: sources.length,
      digital_panchang_months: months.length,
      digital_panchang_days: digitalDays.length,
      digital_panchang_pending_details: digitalDays.filter((day) => String(day.date_confidence || "").toLowerCase() === "needs_review" || String(day.extraction_status || "").toLowerCase().includes("pending")).length,
      digital_panchang_reviewed_days: digitalDays.filter((day) => ["verified", "source_provided"].includes(String(day.date_confidence || "").toLowerCase()) || ["approved", "verified", "source_provided"].includes(String(day.review_status || "").toLowerCase())).length,
      digital_panchang_missing_sources: digitalDays.filter((day) => !String(day.source_image || "").trim() || !String(day.source_name || "").trim()).length,
      digital_panchang_duplicate_days: [...digitalDayIds.values()].filter((count) => count > 1).length,
      needs_review_count: allItems.filter((item) => String(item.date_confidence || "").toLowerCase() === "needs_review").length,
      educational_only_count: allItems.filter((item) => String(item.date_confidence || "").toLowerCase() === "educational_only").length,
      issues_count: findings.length,
      manual_queue_count: manualQueue.length,
      ocr_queue_count: ocrQueue.length
    },
    issues: findings
  };

  const report = {
    generated_at: new Date().toISOString(),
    files_reviewed: [relativePath(paths.sample), relativePath(paths.review), relativePath(paths.sources), relativePath(paths.digital), relativePath(paths.manual), relativePath(paths.ocr)],
    quality
  };

  fs.writeFileSync(paths.report, JSON.stringify(report, null, 2), "utf8");
  fs.writeFileSync(paths.quality, JSON.stringify(quality, null, 2), "utf8");
  console.log(`Wrote ${paths.report}`);
  console.log(`Wrote ${paths.quality}`);
}

function validateLegacyItem(item, sourceNames, slugCounts, findings) {
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
}

function validateMonth(month, findings) {
  const slug = String(month.month_slug || month.id || "").trim();
  const imageUrl = String(month.image_url || month.source_image || "").trim();
  const sourceName = String(month.source_name || "").trim();
  const sourceUrl = String(month.source_url || "").trim();
  const permission = String(month.permission_status || "").trim().toLowerCase();
  const reviewStatus = String(month.review_status || "").trim().toLowerCase();
  const assetPath = imageUrl ? path.join(rootDir, "public", imageUrl.replace(/^\//, "")) : null;

  if (!imageUrl) {
    findings.push(issue("missing_month_image", slug, "Digital panchang month is missing image_url/source_image."));
  }

  if (assetPath && !fs.existsSync(assetPath)) {
    findings.push(issue("missing_month_image_asset", slug, `Digital panchang image asset is missing: ${imageUrl}`));
  }

  if (!sourceName) {
    findings.push(issue("missing_month_source_name", slug, "Digital panchang month is missing source_name."));
  }

  if (!sourceUrl) {
    findings.push(issue("missing_month_source_url", slug, "Digital panchang month is missing source_url."));
  }

  if (!permission) {
    findings.push(issue("missing_month_permission", slug, "Digital panchang month is missing permission_status."));
  }

  if (!reviewStatus) {
    findings.push(issue("missing_month_review_status", slug, "Digital panchang month is missing review_status."));
  }

  const days = Array.isArray(month.days) ? month.days : [];
  if (days.length < 28 || days.length > 31) {
    findings.push(issue("invalid_days_in_month", slug, `Month should contain 28-31 days, found ${days.length}.`));
  }
}

function validateDigitalDay(day, findings) {
  const id = String(day.id || day.gregorian_date || "").trim();
  const date = String(day.gregorian_date || "").trim();
  const titleHi = String(day.title_hi || "").trim();
  const sourceName = String(day.source_name || "").trim();
  const sourceUrl = String(day.source_url || "").trim();
  const sourceImage = String(day.source_image || "").trim();
  const sourcePdf = String(day.source_pdf || "").trim();
  const confidence = String(day.date_confidence || "").trim().toLowerCase();
  const reviewStatus = String(day.review_status || "").trim().toLowerCase();
  const extractionStatus = String(day.extraction_status || "").trim().toLowerCase();
  const shortLabel = String(day.short_label || "").trim();
  const shortLabelHi = String(day.short_label_hi || "").trim();
  const cautionNote = String(day.caution_note || "").trim();
  const sourceNote = String(day.source_note || "").trim();
  const sourceNoteHi = String(day.source_note_hi || "").trim();
  const chips = Array.isArray(day.chips) ? day.chips : [];

  if (!date) {
    findings.push(issue("missing_gregorian_date", id, "Digital day record is missing gregorian_date."));
  } else if (Number.isNaN(new Date(`${date}T00:00:00`).getTime())) {
    findings.push(issue("invalid_gregorian_date", id, "Digital day record has an invalid gregorian_date."));
  }

  if (!titleHi) {
    findings.push(issue("missing_digital_title_hi", id, "Digital day record is missing title_hi."));
  }

  if (!cautionNote) {
    findings.push(issue("missing_digital_caution_note", id, "Digital day record is missing caution_note."));
  }

  if (!sourceName || !sourceUrl || !sourceImage) {
    findings.push(issue("missing_digital_source", id, "Digital day record is missing source metadata."));
  }

  if (!confidence) {
    findings.push(issue("missing_digital_date_confidence", id, "Digital day record is missing date_confidence."));
  }

  if (confidence === "verified" && !String(day.last_verified_at || "").trim()) {
    findings.push(issue("verified_day_missing_last_verified_at", id, "Verified digital day is missing last_verified_at."));
  }

  if (!date && !["educational_only", "needs_review"].includes(confidence)) {
    findings.push(issue("digital_null_date_invalid_confidence", id, "Digital days without a Gregorian date should be educational_only or needs_review."));
  }

  if (["approved", "verified", "source_provided"].includes(reviewStatus) && !sourceNote && !sourceNoteHi) {
    findings.push(issue("approved_day_missing_source_note", id, "Reviewed digital day should include a source note."));
  }

  if (chips.length && !shortLabel && !shortLabelHi) {
    findings.push(issue("chips_without_short_label", id, "Digital day with chips should also provide a short label."));
  }

  if (extractionStatus === "pending_manual_extraction" && confidence === "verified") {
    findings.push(issue("pending_extraction_verified_day", id, "Verified day should not remain pending manual extraction."));
  }

  if (sourcePdf && !sourceImage) {
    findings.push(issue("pdf_without_month_image", id, "Digital day record references a PDF without a month source image."));
  }
}

function validateManualQueue(item, findings) {
  const id = String(item.id || "").trim();
  if (!String(item.review_status || "").trim()) {
    findings.push(issue("manual_missing_review_status", id, "Manual extraction queue item is missing review_status."));
  }
  if (!String(item.status || "").trim()) {
    findings.push(issue("manual_missing_status", id, "Manual extraction queue item is missing status."));
  }
  if (!String(item.source_month || "").trim()) {
    findings.push(issue("manual_missing_source_month", id, "Manual extraction queue item is missing source_month."));
  }
}

function validateOcrQueue(item, findings) {
  const id = String(item.id || "").trim();
  if (!String(item.review_status || "").trim()) {
    findings.push(issue("ocr_missing_review_status", id, "OCR queue item is missing review_status."));
  }
  if (!String(item.ocr_status || "").trim()) {
    findings.push(issue("ocr_missing_status", id, "OCR queue item is missing ocr_status."));
  }
  if (!String(item.source_image || "").trim()) {
    findings.push(issue("ocr_missing_source_image", id, "OCR queue item is missing source_image."));
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

function readJson(filePath) {
  if (!fs.existsSync(filePath)) {
    return null;
  }

  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

function ensureDir(dirPath) {
  fs.mkdirSync(dirPath, { recursive: true });
}

function relativePath(filePath) {
  return path.relative(rootDir, filePath).replace(/\\/g, "/");
}
