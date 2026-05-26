const fs = require("fs");
const path = require("path");

const rootDir = path.resolve(__dirname, "..", "..");
const inputPath = path.join(rootDir, "public", "data", "review-community-directory.json");
const reportDir = path.join(rootDir, "tools", "reports");
const reportPath = path.join(reportDir, "community-directory-review-report.json");
const publicOutputPath = path.join(rootDir, "public", "data", "review-community-directory-quality.json");

function main() {
  const records = readJson(inputPath);
  const items = Array.isArray(records) ? records : [];

  const scored = items.map(scoreRecord);
  const summary = {
    generated_at: new Date().toISOString(),
    total_records: scored.length,
    needs_review: scored.filter((item) => item.review_status === "needs_review").length,
    pending_review: scored.filter((item) => item.review_status === "pending_review").length,
    average_quality_score:
      scored.length ? Math.round(scored.reduce((total, item) => total + item.quality_score, 0) / scored.length) : 0
  };

  const report = {
    summary,
    items: scored
  };

  ensureDir(reportDir);
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2), "utf8");
  fs.writeFileSync(publicOutputPath, JSON.stringify(scored, null, 2), "utf8");

  console.log(`Wrote ${reportPath}`);
  console.log(`Wrote ${publicOutputPath}`);
  console.log(`Records scored: ${scored.length}`);
}

function scoreRecord(item) {
  const missing = [];
  let score = 100;

  if (!item.city) {
    missing.push("city");
    score -= 10;
  }
  if (!item.state) {
    missing.push("state");
    score -= 10;
  }
  if (!item.website) {
    missing.push("website");
    score -= 20;
  }
  if (!item.source_url) {
    missing.push("source_url");
    score -= 25;
  }
  if (!item.review_status) {
    missing.push("review_status");
    score -= 25;
  }

  return {
    id: item.id,
    type: item.type,
    name: item.name,
    country: item.country || "",
    review_status: item.review_status || "needs_review",
    quality_score: Math.max(0, score),
    quality_label: score >= 80 ? "usable" : score >= 55 ? "limited" : "needs_review",
    missing_fields: missing,
    notes: item.notes || "",
    created_at: item.created_at || ""
  };
}

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

function ensureDir(dirPath) {
  fs.mkdirSync(dirPath, { recursive: true });
}

main();
