const fs = require("fs");
const path = require("path");

const rootDir = path.resolve(__dirname, "..");
const dataDir = path.join(rootDir, "public", "data");
const dbDir = path.join(rootDir, "db");

const datasets = [
  {
    source: "sample-resources.json",
    output: "seed-resources.sql",
    table: "resources",
    map: (item) => ({
      id: item.id,
      title: item.title_en || item.title_hi || "",
      slug: item.slug || item.id,
      category: item.category || "",
      summary: item.summary_en || item.summary_hi || "",
      eligibility: item.eligibility_en || "",
      benefit: item.benefit_en || "",
      documents_required: item.documents_required_en || "",
      state: item.state || "",
      official_url: item.official_url || "",
      source_name: item.source_name || "",
      last_verified_at: item.last_verified_at || "",
      review_status: item.review_status || "pending_review",
      status: item.status || "draft",
      created_at: item.last_verified_at || new Date().toISOString(),
      reviewed_at: "",
      reviewed_by: ""
    })
  },
  {
    source: "sample-news.json",
    output: "seed-news.sql",
    table: "news_items",
    map: (item) => ({
      id: item.id,
      title: item.title_en || item.title_hi || "",
      slug: item.slug || item.id,
      summary: item.summary_en || item.summary_hi || "",
      source_name: item.source_name || item.source || "",
      source_url: item.source_url || item.link || "",
      canonical_url: item.canonical_url || item.source_url || item.link || "",
      content_hash: item.content_hash || "",
      duplicate_group_id: item.duplicate_group_id || "",
      category: item.category || "General",
      region: item.region || "India",
      relevance_score: item.relevance_score || 0,
      review_status: item.review_status || "pending_review",
      status: item.status || "draft",
      created_at: item.published_at || new Date().toISOString(),
      published_at: item.published_at || "",
      reviewed_at: "",
      reviewed_by: ""
    })
  },
  {
    source: "sample-audio.json",
    output: "seed-audio.sql",
    table: "audio_items",
    map: (item) => ({
      id: item.id,
      title: item.title || "",
      slug: item.slug || item.id,
      category: item.category || "",
      speaker: item.speaker || "",
      singer: item.singer || "",
      tradition: item.tradition || "General",
      language: item.language || "",
      duration: item.duration || "",
      audio_url: item.audio_url || "",
      embed_url: item.embed_url || "",
      source: item.source || "",
      permission_status: item.permission_status || "needs_review",
      verified_status: item.verified_status || "pending_review",
      review_status: item.review_status || "pending_review",
      status: item.status || "draft",
      created_at: item.published_at || new Date().toISOString(),
      reviewed_at: "",
      reviewed_by: ""
    })
  },
  {
    source: "review-temple-corrections.json",
    output: "seed-temple-corrections-sample.sql",
    table: "temple_corrections",
    map: (item) => ({
      id: item.id,
      temple_slug: item.temple_slug || item.related_slug || "unknown-temple",
      correction_category: item.correction_category || item.title || "General update",
      current_value: item.current_value || "",
      suggested_value: item.suggested_value || item.summary || "",
      source_url: item.source_url || "",
      submitted_by_name: item.submitted_by_name || item.submitted_by || "",
      submitted_by_email: "",
      review_status: item.review_status || "pending_review",
      priority: item.priority || "medium",
      created_at: item.created_at || new Date().toISOString(),
      reviewed_at: "",
      reviewed_by: ""
    })
  }
];

function main() {
  if (!fs.existsSync(dbDir)) {
    fs.mkdirSync(dbDir, { recursive: true });
  }

  datasets.forEach((dataset) => {
    const sourcePath = path.join(dataDir, dataset.source);
    if (!fs.existsSync(sourcePath)) {
      console.warn(`Skipping missing source file: ${dataset.source}`);
      return;
    }

    const raw = fs.readFileSync(sourcePath, "utf8");
    const items = JSON.parse(raw);
    const rows = Array.isArray(items) ? items.map(dataset.map) : [];
    const sql = buildInsertSql(dataset.table, rows);
    const outputPath = path.join(dbDir, dataset.output);
    fs.writeFileSync(outputPath, sql, "utf8");
    console.log(`Wrote ${dataset.output}`);
  });

  console.log("");
  console.log("Next step example:");
  console.log("npx wrangler d1 execute jainworld-db --remote --file ./db/seed-resources.sql");
}

function buildInsertSql(table, rows) {
  if (!rows.length) {
    return `-- No rows generated for ${table}\n`;
  }

  const columns = Object.keys(rows[0]);
  const statements = rows.map((row) => {
    const values = columns.map((column) => toSqlValue(row[column]));
    return `INSERT OR IGNORE INTO ${table} (${columns.join(", ")}) VALUES (${values.join(", ")});`;
  });

  return `-- Generated from JSON seed sources\nBEGIN TRANSACTION;\n${statements.join("\n")}\nCOMMIT;\n`;
}

function toSqlValue(value) {
  if (value === null || value === undefined || value === "") {
    return "NULL";
  }

  if (typeof value === "number") {
    return Number.isFinite(value) ? String(value) : "0";
  }

  const text = String(value).replace(/'/g, "''");
  return `'${text}'`;
}

main();
