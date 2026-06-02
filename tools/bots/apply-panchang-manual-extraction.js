const fs = require("fs");
const path = require("path");

const rootDir = path.resolve(__dirname, "..", "..");
const dataDir = path.join(rootDir, "public", "data");
const reportDir = path.join(rootDir, "tools", "reports");

const digitalPath = path.join(dataDir, "panchang-digital-2026.json");
const manualPath = path.join(dataDir, "review-panchang-manual-extraction.json");
const reportPath = path.join(reportDir, "panchang-manual-merge-report.json");

main();

function main() {
  ensureDir(reportDir);

  const digital = readJson(digitalPath);
  const manual = readJson(manualPath);

  if (!digital || !Array.isArray(digital.months)) {
    throw new Error("Digital Panchang dataset not found or malformed.");
  }

  const monthMap = new Map(digital.months.map((month) => [Number(month.month_number), month]));
  const rows = Array.isArray(manual) ? manual : [];
  const report = {
    generated_at: new Date().toISOString(),
    manual_items: rows.length,
    merged_items: 0,
    skipped_items: 0,
    blocked_items: 0,
    warnings: [],
    updated_days: []
  };

  rows.forEach((item) => {
    const status = String(item.review_status || item.status || "").toLowerCase();
    const confidence = String(item.date_confidence || "").toLowerCase();
    const approved = ["approved", "verified", "source_provided"].includes(status) || ["verified", "source_provided"].includes(confidence);

    if (!approved) {
      report.skipped_items += 1;
      return;
    }

    const gregorianDate = String(item.gregorian_date || item.date || "").trim();
    const monthNumber = Number(item.month_number || getMonthFromDate(gregorianDate));
    const dayNumber = Number(item.day_number || getDayFromDate(gregorianDate));
    const targetMonth = monthMap.get(monthNumber);

    if (!targetMonth || !dayNumber || dayNumber < 1) {
      report.blocked_items += 1;
      report.warnings.push(`Could not map manual record ${item.id || "(missing id)"} to a day.`);
      return;
    }

    const targetDay = Array.isArray(targetMonth.days) ? targetMonth.days.find((day) => Number(day.day_number) === dayNumber) : null;
    if (!targetDay) {
      report.blocked_items += 1;
      report.warnings.push(`No matching day found for ${gregorianDate || `${monthNumber}-${dayNumber}`}.`);
      return;
    }

    const patch = buildPatch(item);
    Object.assign(targetDay, patch);
    report.merged_items += 1;
    report.updated_days.push(targetDay.gregorian_date);
  });

  fs.writeFileSync(digitalPath, JSON.stringify(digital, null, 2), "utf8");
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2), "utf8");
  console.log(`Wrote ${reportPath}`);
  console.log(`Updated ${digitalPath}`);
}

function buildPatch(item) {
  const sourceFields = [
    "short_label",
    "short_label_hi",
    "event_type",
    "date_confidence",
    "review_status",
    "extraction_status",
    "lunar_month",
    "lunar_month_hi",
    "lunar_tithi",
    "lunar_tithi_hi",
    "paksha",
    "paksha_hi",
    "nakshatra",
    "nakshatra_hi",
    "hora",
    "hora_hi",
    "summary",
    "summary_hi",
    "source_note",
    "source_note_hi",
    "caution_note",
    "caution_note_hi"
  ];

  const patch = {};
  sourceFields.forEach((field) => {
    if (item[field] !== undefined && item[field] !== null && String(item[field]).trim() !== "") {
      patch[field] = item[field];
    }
  });

  patch.review_status = patch.review_status || "pending_review";
  patch.extraction_status = patch.extraction_status || "manual_review_pending";
  patch.date_confidence = patch.date_confidence || "needs_review";
  patch.reviewed_at = item.reviewed_at || new Date().toISOString();
  patch.reviewed_by = item.reviewed_by || "manual-review";

  if (item.muhurat && typeof item.muhurat === "object") {
    patch.muhurat = item.muhurat;
  }

  if (Array.isArray(item.chips)) {
    patch.chips = item.chips;
  }

  return patch;
}

function getMonthFromDate(gregorianDate) {
  if (!gregorianDate) {
    return 0;
  }
  const date = new Date(gregorianDate);
  return Number.isNaN(date.getTime()) ? 0 : date.getMonth() + 1;
}

function getDayFromDate(gregorianDate) {
  if (!gregorianDate) {
    return 0;
  }
  const date = new Date(gregorianDate);
  return Number.isNaN(date.getTime()) ? 0 : date.getDate();
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
