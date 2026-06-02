const fs = require("fs");
const path = require("path");
const crypto = require("crypto");
const { spawnSync } = require("child_process");

const rootDir = path.resolve(__dirname, "..", "..");
const dataDir = path.join(rootDir, "public", "data");
const assetDir = path.join(rootDir, "public", "assets", "calendar", "panchang-2026");
const reportDir = path.join(rootDir, "tools", "reports");
const exportDir = path.join(rootDir, "tools", "exports", "panchang-ocr");

const digitalPath = path.join(dataDir, "panchang-digital-2026.json");
const ocrReviewPath = path.join(dataDir, "review-panchang-ocr-extraction.json");
const reportPath = path.join(reportDir, "panchang-ocr-summary.json");

const MONTH_FILES = [
  "january-2026.jpg",
  "february-2026.jpg",
  "march-2026.jpg",
  "april-2026.jpg",
  "may-2026.jpg",
  "june-2026.jpg",
  "july-2026.jpg",
  "august-2026.jpg",
  "september-2026.jpg",
  "october-2026.jpg",
  "november-2026.jpg",
  "december-2026.jpg"
];

main();

function main() {
  ensureDir(reportDir);
  ensureDir(exportDir);

  const report = {
    generated_at: new Date().toISOString(),
    engine: null,
    available: false,
    files_scanned: [],
    files_ocrd: [],
    warnings: [],
    errors: [],
    output_files: [relativePath(reportPath), relativePath(ocrReviewPath)]
  };

  const engineCheck = spawnSync("tesseract", ["--version"], { encoding: "utf8", timeout: 20000 });
  if (engineCheck.error || engineCheck.status !== 0) {
    report.warnings.push("Tesseract OCR engine was not found. Manual review queue only.");
    writeReviewQueue(report, buildNotRunQueue());
    writeReport(report);
    console.log("OCR engine not found. Manual extraction queue created only.");
    return;
  }

  report.available = true;
  report.engine = "tesseract";

  const digital = readJson(digitalPath);
  const months = Array.isArray(digital?.months) ? digital.months : [];
  const reviewQueue = [];

  MONTH_FILES.forEach((fileName, index) => {
    const imagePath = path.join(assetDir, fileName);
    const monthRecord = months[index] || null;
    const monthLabel = monthRecord?.month_name || fileName;
    const item = {
      id: `ocr-panchang-2026-${String(index + 1).padStart(2, "0")}`,
      source_month: monthLabel,
      source_image: `/assets/calendar/panchang-2026/${fileName}`,
      ocr_status: "pending",
      review_status: "pending_review",
      source_name: "Tirthankar Vardhman Jain Panchang 2026",
      source_url: "https://www.onlinejainpathshala.com/",
      notes: "OCR-assisted draft. Do not publish without manual review.",
      notes_hi: "OCR-सहायित मसौदा। मैन्युअल समीक्षा के बिना प्रकाशित न करें।"
    };

    report.files_scanned.push(relativePath(imagePath));

    if (!fs.existsSync(imagePath)) {
      item.ocr_status = "missing_image";
      item.review_status = "blocked";
      item.notes = "Source image missing.";
      item.notes_hi = "स्रोत छवि अनुपलब्ध है।";
      report.errors.push(`Missing image: ${relativePath(imagePath)}`);
      reviewQueue.push(item);
      return;
    }

    const textOutput = path.join(exportDir, `${fileName.replace(/\.jpg$/i, ".txt")}`);
    const result = spawnSync("tesseract", [imagePath, "stdout", "--psm", "6", "--oem", "1"], {
      encoding: "utf8",
      timeout: 120000
    });

    const text = String(result.stdout || "").trim();
    const hash = hashFile(imagePath);
    const excerpt = text.slice(0, 1000);

    if (result.error || result.status !== 0) {
      item.ocr_status = "ocr_failed";
      item.review_status = "pending_review";
      item.notes = "OCR engine returned an error. Manual review required.";
      item.notes_hi = "OCR इंजन ने त्रुटि दी। मैन्युअल समीक्षा आवश्यक है।";
      if (result.stderr) {
        report.errors.push(`${fileName}: ${sanitize(result.stderr)}`);
      }
    } else {
      fs.writeFileSync(textOutput, text || "", "utf8");
      report.files_ocrd.push(relativePath(textOutput));
      item.ocr_status = text ? "ocr_text_captured" : "ocr_empty";
      item.content_hash = hash;
      item.text_excerpt = excerpt;
      item.text_excerpt_hi = excerpt;
      item.review_status = "pending_review";
      item.notes = "OCR text captured for manual review only.";
      item.notes_hi = "OCR पाठ केवल मैन्युअल समीक्षा के लिए कैप्चर किया गया है।";
    }

    reviewQueue.push(item);
  });

  writeReviewQueue(report, reviewQueue);
  writeReport(report);
  console.log(`Wrote ${reportPath}`);
  console.log(`Wrote ${ocrReviewPath}`);
}

function buildNotRunQueue() {
  return MONTH_FILES.map((fileName, index) => ({
    id: `ocr-panchang-2026-${String(index + 1).padStart(2, "0")}`,
    source_month: `${monthName(index + 1)} 2026`,
    source_image: `/assets/calendar/panchang-2026/${fileName}`,
    ocr_status: "not_run",
    review_status: "pending_review",
    source_name: "Tirthankar Vardhman Jain Panchang 2026",
    source_url: "https://www.onlinejainpathshala.com/",
    notes: "OCR engine not available locally.",
    notes_hi: "स्थानीय OCR इंजन उपलब्ध नहीं है।"
  }));
}

function writeReviewQueue(report, queue) {
  fs.writeFileSync(ocrReviewPath, JSON.stringify(queue, null, 2), "utf8");
  report.review_items = queue.length;
}

function writeReport(report) {
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2), "utf8");
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

function hashFile(filePath) {
  const hash = crypto.createHash("sha256");
  hash.update(fs.readFileSync(filePath));
  return hash.digest("hex");
}

function monthName(monthNumber) {
  return [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December"
  ][monthNumber - 1] || `Month ${monthNumber}`;
}

function sanitize(value) {
  return String(value || "").replace(/\s+/g, " ").trim().slice(0, 400);
}

function relativePath(filePath) {
  return path.relative(rootDir, filePath).replace(/\\/g, "/");
}
