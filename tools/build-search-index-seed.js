const fs = require("fs");
const path = require("path");

const rootDir = path.resolve(__dirname, "..");
const dataDir = path.join(rootDir, "public", "data");
const outputPath = path.join(rootDir, "db", "seed-search-index.sql");

const SOURCES = [
  { type: "literature", file: "sample-literature.json", weight: 5, mapper: mapLiterature },
  { type: "blogs", file: "sample-blogs.json", weight: 3, mapper: mapBlogs },
  { type: "food", file: "sample-food.json", weight: 4, mapper: mapFood },
  { type: "education", file: "sample-education.json", weight: 4, mapper: mapEducation },
  { type: "temples", file: "sample-temples.json", weight: 5, mapper: mapTemples },
  { type: "audio", file: "sample-audio.json", weight: 4, mapper: mapAudio },
  { type: "news", file: "sample-news.json", weight: 3, mapper: mapNews },
  { type: "resources", file: "sample-resources.json", weight: 5, mapper: mapResources },
  { type: "calendar", file: "sample-calendar.json", weight: 3, mapper: mapCalendar }
];

function main() {
  const rows = [];
  const counts = {};

  SOURCES.forEach((source) => {
    const sourcePath = path.join(dataDir, source.file);
    if (!fs.existsSync(sourcePath)) {
      console.warn(`Skipping missing file: ${source.file}`);
      return;
    }

    const items = JSON.parse(fs.readFileSync(sourcePath, "utf8"));
    if (!Array.isArray(items)) {
      return;
    }

    items.forEach((item, index) => {
      const row = source.mapper(item, source.weight, index);
      if (!row) {
        return;
      }

      rows.push(row);
      counts[source.type] = (counts[source.type] || 0) + 1;
    });
  });

  const sql = buildSql(rows);
  fs.writeFileSync(outputPath, sql, "utf8");
  console.log(`Wrote ${outputPath}`);
  Object.entries(counts).forEach(([type, count]) => {
    console.log(`${type}: ${count}`);
  });
}

function buildSql(rows) {
  if (!rows.length) {
    return "-- No search index rows generated.\n";
  }

  const columns = [
    "id",
    "content_type",
    "source_id",
    "title",
    "summary",
    "body",
    "url",
    "category",
    "tags",
    "language",
    "status",
    "review_status",
    "source_name",
    "published_at",
    "updated_at",
    "search_weight",
    "created_at"
  ];

  const statements = rows.map((row) => {
    const values = columns.map((column) => sqlValue(row[column]));
    return `INSERT OR REPLACE INTO search_index (${columns.join(", ")}) VALUES (${values.join(", ")});`;
  });

  return `-- Generated universal search index seed\nBEGIN TRANSACTION;\n${statements.join("\n")}\nCOMMIT;\n`;
}

function baseRow(type, item, weight, title, summary, body, url, extra = {}) {
  const sourceId = item.slug || item.id || `${type}-${title.toLowerCase().replace(/\s+/g, "-")}`;
  return {
    id: `search-index-${type}-${sourceId}`,
    content_type: type,
    source_id: sourceId,
    title: clean(title),
    summary: clean(summary),
    body: clean(body),
    url,
    category: clean(extra.category || ""),
    tags: clean(extra.tags || ""),
    language: clean(extra.language || "en"),
    status: "published",
    review_status: clean(extra.review_status || "verified"),
    source_name: clean(extra.source_name || "JainWorld"),
    published_at: clean(extra.published_at || item.created_at || ""),
    updated_at: clean(extra.updated_at || item.updated_at || item.created_at || ""),
    search_weight: weight,
    created_at: clean(extra.created_at || item.created_at || item.published_at || "2026-01-01")
  };
}

function mapLiterature(item, weight) {
  return baseRow(
    "literature",
    item,
    weight,
    item.title_en || item.title_hi,
    item.summary_en || item.summary_hi,
    [item.summary_en, item.content_en, item.category, item.subcategory, item.tags].filter(Boolean).join(" "),
    `/article.html?type=literature&slug=${encodeURIComponent(item.slug || item.id || "")}`,
    {
      category: item.category,
      tags: item.tags,
      review_status: item.status === "published" ? "verified" : "approved"
    }
  );
}

function mapBlogs(item, weight) {
  return baseRow(
    "blogs",
    item,
    weight,
    item.title_en || item.title_hi || item.title,
    item.summary_en || item.summary_hi || item.summary,
    [item.summary_en, item.content_en, item.category, item.tags].filter(Boolean).join(" "),
    `/article.html?type=blogs&slug=${encodeURIComponent(item.slug || item.id || "")}`,
    {
      category: item.category,
      tags: item.tags,
      source_name: item.author || "JainWorld Editorial",
      review_status: "approved",
      published_at: item.created_at,
      updated_at: item.updated_at,
      created_at: item.created_at
    }
  );
}

function mapFood(item, weight) {
  return baseRow(
    "food",
    item,
    weight,
    item.title_en || item.title_hi,
    item.summary_en || item.summary_hi,
    [item.summary_en, item.ingredients_en, item.method_en, item.spiritual_reason_en, item.scientific_reason_en, item.tags].filter(Boolean).join(" "),
    `/article.html?type=food&slug=${encodeURIComponent(item.slug || item.id || "")}`,
    {
      category: item.category || item.type,
      tags: item.tags,
      review_status: "verified"
    }
  );
}

function mapEducation(item, weight) {
  return baseRow(
    "education",
    item,
    weight,
    item.lesson_title_en || item.course_title_en,
    item.course_title_en || item.topic,
    [item.course_title_en, item.lesson_title_en, item.topic, item.content_en, item.difficulty].filter(Boolean).join(" "),
    `/course-detail.html?slug=${encodeURIComponent(item.slug || item.id || "")}`,
    {
      category: item.course_level,
      tags: item.topic,
      review_status: "verified"
    }
  );
}

function mapTemples(item, weight) {
  return baseRow(
    "temples",
    item,
    weight,
    item.name_en || item.name_hi,
    [item.city, item.state, item.country].filter(Boolean).join(", "),
    [item.name_en, item.city, item.state, item.country, item.address, item.history_en, item.rituals_en, item.category].filter(Boolean).join(" "),
    `/temple-detail.html?slug=${encodeURIComponent(item.slug || item.id || "")}`,
    {
      category: item.category,
      tags: [item.city, item.state, item.country, item.main_deity, item.tradition].filter(Boolean).join(", "),
      review_status: "verified",
      updated_at: item.last_verified_at,
      created_at: item.created_at || item.last_verified_at
    }
  );
}

function mapAudio(item, weight) {
  return baseRow(
    "audio",
    item,
    weight,
    item.title,
    item.meaning_en || item.category,
    [item.title, item.category, item.speaker, item.singer, item.tradition, item.language, item.meaning_en].filter(Boolean).join(" "),
    `/audio-detail.html?slug=${encodeURIComponent(item.slug || item.id || "")}`,
    {
      category: item.category,
      tags: [item.speaker, item.singer, item.tradition, item.language].filter(Boolean).join(", "),
      source_name: item.source,
      review_status: item.verified_status || "approved",
      published_at: item.published_at,
      updated_at: item.published_at,
      created_at: item.published_at
    }
  );
}

function mapNews(item, weight) {
  return baseRow(
    "news",
    item,
    weight,
    item.title_en || item.title,
    item.summary_en || item.summary,
    [item.title_en, item.summary_en, item.category, item.region].filter(Boolean).join(" "),
    "/news.html",
    {
      category: item.category,
      tags: item.region,
      source_name: item.source_name,
      review_status: item.review_status || "approved",
      published_at: item.published_at,
      updated_at: item.published_at,
      created_at: item.published_at
    }
  );
}

function mapResources(item, weight) {
  return baseRow(
    "resources",
    item,
    weight,
    item.title_en || item.title_hi,
    item.summary_en || item.summary_hi,
    [item.summary_en, item.eligibility_en, item.benefit_en, item.documents_required_en, item.category, item.state].filter(Boolean).join(" "),
    "/resources.html",
    {
      category: item.category,
      tags: item.state,
      source_name: item.source_name,
      review_status: item.review_status || "verified",
      published_at: item.last_verified_at,
      updated_at: item.last_verified_at,
      created_at: item.last_verified_at || "2026-01-01"
    }
  );
}

function mapCalendar(item, weight) {
  return baseRow(
    "calendar",
    item,
    weight,
    item.festival_en || item.festival_hi || item.tithi,
    item.description_en || item.description_hi || item.tithi,
    [item.festival_en, item.description_en, item.tithi, item.category, item.rituals_en].filter(Boolean).join(" "),
    "/calendar.html",
    {
      category: item.category,
      tags: item.tithi,
      review_status: "verified",
      published_at: item.date_gregorian,
      updated_at: item.date_gregorian,
      created_at: item.date_gregorian
    }
  );
}

function sqlValue(value) {
  if (value === null || value === undefined || value === "") {
    return "NULL";
  }
  if (typeof value === "number") {
    return Number.isFinite(value) ? String(value) : "0";
  }
  return `'${String(value).replace(/'/g, "''")}'`;
}

function clean(value) {
  return String(value || "").replace(/\s+/g, " ").trim();
}

main();
