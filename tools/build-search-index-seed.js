const fs = require("fs");
const path = require("path");

const rootDir = path.resolve(__dirname, "..");
const dataDir = path.join(rootDir, "public", "data");
const outputPaths = [
  { path: path.join(rootDir, "db", "seed-search-index.sql"), transactional: true },
  { path: path.join(rootDir, "db", "seed-search-index-d1.sql"), transactional: true },
  { path: path.join(rootDir, "db", "seed-search-index-d1-clean.sql"), transactional: false }
];

const SOURCES = [
  { type: "literature", file: "sample-literature.json", weight: 5, mapper: mapLiterature },
  { type: "blogs", file: "sample-blogs.json", weight: 3, mapper: mapBlogs },
  { type: "food", file: "sample-food.json", weight: 4, mapper: mapFood },
  { type: "education", file: "sample-education.json", weight: 4, mapper: mapEducation },
  { type: "temples", file: "sample-temples.json", weight: 5, mapper: mapTemples },
  { type: "audio", file: "sample-audio.json", weight: 4, mapper: mapAudio },
  { type: "news", file: "sample-news.json", weight: 3, mapper: mapNews },
  { type: "resources", file: "sample-resources.json", weight: 5, mapper: mapResources },
  { type: "calendar", file: "sample-calendar.json", weight: 3, mapper: mapCalendar },
  { type: "directory", file: "sample-directory.json", weight: 5, mapper: mapDirectory },
  { type: "speakers", file: "sample-speakers.json", weight: 3, mapper: mapSpeakers },
  { type: "names", file: "sample-names.json", weight: 2, mapper: mapNames },
  { type: "dictionary", file: "sample-dictionary.json", weight: 4, mapper: mapDictionary },
  { type: "books", file: "sample-books.json", weight: 4, mapper: mapBooks }
];

const TYPE_SYNONYMS = {
  books: ["book", "books", "literature", "reading list", "पुस्तकें"],
  dictionary: ["dictionary", "terms", "glossary", "शब्दकोश"],
  names: ["names", "baby names", "Jain names", "नाम"],
  speakers: ["speakers", "scholars", "lectures", "प्रवचन", "वक्ता"],
  directory: ["directory", "resources", "sections", "निर्देशिका"]
};

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

  outputPaths.forEach((output) => {
    const sql = buildSql(rows, output.transactional);
    fs.writeFileSync(output.path, sql, "utf8");
    console.log(`Wrote ${output.path}`);
  });
  Object.entries(counts).forEach(([type, count]) => {
    console.log(`${type}: ${count}`);
  });
}

function buildSql(rows, transactional = true) {
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

  if (!transactional) {
    return `-- Generated universal search index seed\n${statements.join("\n")}\n`;
  }

  return `-- Generated universal search index seed\nBEGIN TRANSACTION;\n${statements.join("\n")}\nCOMMIT;\n`;
}

function baseRow(type, item, weight, title, summary, body, url, extra = {}) {
  const sourceId = item.slug || item.id || `${type}-${title.toLowerCase().replace(/\s+/g, "-")}`;
  const enrichedBody = buildIndexedBody(type, body);
  return {
    id: `search-index-${type}-${sourceId}`,
    content_type: type,
    source_id: sourceId,
    title: cleanSearchText(title),
    summary: cleanSearchText(summary),
    body: cleanSearchText(enrichedBody),
    url,
    category: cleanSearchText(extra.category || ""),
    tags: cleanSearchText(extra.tags || ""),
    language: clean(extra.language || "en"),
    status: "published",
    review_status: cleanSearchText(extra.review_status || "verified"),
    source_name: cleanSearchText(extra.source_name || "JainWorld"),
    published_at: cleanSearchText(extra.published_at || item.created_at || ""),
    updated_at: cleanSearchText(extra.updated_at || item.updated_at || item.created_at || ""),
    search_weight: weight,
    created_at: cleanSearchText(extra.created_at || item.created_at || item.published_at || "2026-01-01")
  };
}

function buildIndexedBody(type, body) {
  const synonyms = TYPE_SYNONYMS[type] || [];
  return [type, ...synonyms, body].filter(Boolean).join(" ");
}

function mapLiterature(item, weight) {
  return baseRow(
    "literature",
    item,
    weight,
    item.title_en || item.title_hi,
    item.summary_en || item.summary_hi,
    [
      item.summary_en,
      item.summary_hi,
      item.content_en,
      item.content_hi,
      item.category,
      item.subcategory,
      item.tags
    ].filter(Boolean).join(" "),
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
    [
      item.course_title_en,
      item.course_title_hi,
      item.lesson_title_en,
      item.lesson_title_hi,
      item.topic,
      item.content_en,
      item.content_hi,
      item.difficulty
    ].filter(Boolean).join(" "),
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
    [
      item.name_en,
      item.name_hi,
      item.city,
      item.state,
      item.country,
      item.address,
      item.history_en,
      item.history_hi,
      item.rituals_en,
      item.rituals_hi,
      item.category,
      item.main_deity
    ].filter(Boolean).join(" "),
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
    [
      item.title,
      item.title_hi,
      item.category,
      item.speaker,
      item.singer,
      item.tradition,
      item.language,
      item.meaning_en,
      item.meaning_hi
    ].filter(Boolean).join(" "),
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
    [
      item.summary_en,
      item.summary_hi,
      item.eligibility_en,
      item.eligibility_hi,
      item.benefit_en,
      item.benefit_hi,
      item.documents_required_en,
      item.documents_required_hi,
      item.category,
      item.state
    ].filter(Boolean).join(" "),
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
    item.title || item.title_hi || item.slug,
    item.summary || item.summary_hi || item.date_display || item.date_display_hi || item.lunar_tithi,
    [
      item.title,
      item.title_hi,
      item.summary,
      item.summary_hi,
      item.date_display,
      item.date_display_hi,
      item.lunar_month,
      item.lunar_month_hi,
      item.lunar_tithi,
      item.lunar_tithi_hi,
      item.tradition_scope,
      item.location_scope,
      item.source_note,
      item.source_note_hi,
      item.caution_note,
      item.caution_note_hi,
      Array.isArray(item.tags) ? item.tags.join(" ") : item.tags
    ].filter(Boolean).join(" "),
    "/calendar.html",
    {
      category: item.type,
      tags: [item.lunar_tithi, item.tradition_scope, item.location_scope, Array.isArray(item.tags) ? item.tags.join(", ") : item.tags]
        .filter(Boolean)
        .join(", "),
      review_status: item.review_status || "needs_review",
      source_name: item.source_name || "JainWorld Calendar",
      published_at: item.last_verified_at,
      updated_at: item.last_verified_at,
      created_at: item.last_verified_at || "2026-05-26"
    }
  );
}

function mapDirectory(item, weight) {
  return baseRow(
    "directory",
    item,
    weight,
    item.title || item.title_hi,
    item.summary || item.summary_hi,
    [item.summary, item.category, item.tags, item.related_sections].filter(Boolean).join(" "),
    item.url || "/directory.html",
    {
      category: item.category,
      tags: item.tags,
      review_status: item.review_status || "needs_review",
      source_name: "JainWorld Directory",
      created_at: "2026-05-26"
    }
  );
}

function mapSpeakers(item, weight) {
  return baseRow(
    "speakers",
    item,
    weight,
    item.name || item.name_hi,
    item.summary || item.summary_hi,
    [item.summary, item.tradition_or_context, item.topics, item.related_audio, item.related_literature].filter(Boolean).join(" "),
    "/speakers.html",
    {
      category: item.tradition_or_context,
      tags: item.topics,
      review_status: item.review_status || "needs_review",
      source_name: "JainWorld Speakers",
      created_at: "2026-05-26"
    }
  );
}

function mapNames(item, weight) {
  return baseRow(
    "names",
    item,
    weight,
    item.name || item.name_hi,
    item.meaning || item.meaning_hi,
    [item.name, item.name_hi, item.meaning, item.meaning_hi, item.gender, item.source_note].filter(Boolean).join(" "),
    "/names.html",
    {
      category: item.gender,
      tags: item.meaning,
      review_status: item.review_status || "needs_review",
      source_name: "JainWorld Names",
      created_at: "2026-05-26"
    }
  );
}

function mapDictionary(item, weight) {
  return baseRow(
    "dictionary",
    item,
    weight,
    item.term || item.term_hi,
    item.simple_meaning || item.simple_meaning_hi,
    [item.term, item.term_hi, item.simple_meaning, item.simple_meaning_hi, item.category].filter(Boolean).join(" "),
    "/dictionary.html",
    {
      category: item.category,
      tags: item.term,
      review_status: item.review_status || "needs_review",
      source_name: "JainWorld Dictionary",
      created_at: "2026-05-26"
    }
  );
}

function mapBooks(item, weight) {
  if (String(item.license_status || "").toLowerCase() === "not_allowed") {
    return null;
  }

  if (String(item.permission_status || "").toLowerCase() === "not_allowed") {
    return null;
  }

  return baseRow(
    "books",
    item,
    weight,
    item.title || item.title_hi,
    item.summary || item.summary_hi,
    [
      item.title,
      item.title_hi,
      item.author,
      item.author_hi,
      item.summary,
      item.summary_hi,
      item.category,
      item.source_name,
      Array.isArray(item.tags) ? item.tags.join(" ") : item.tags
    ].filter(Boolean).join(" "),
    "/books.html",
    {
      category: item.category,
      tags: Array.isArray(item.tags) ? item.tags.join(", ") : item.tags,
      review_status: item.review_status || "needs_review",
      source_name: item.source_name || "JainWorld Books",
      created_at: item.last_checked_at || "2026-05-27"
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

const MOJIBAKE_FRAGMENTS = [
  "\u00e0\u00a4",
  "\u00e0\u00a5",
  "\u00e2\u0080\u00a2",
  "\u00c2\u00a9",
  "\u00e2\u0080\u0094",
  "\u00e2\u0080\u0093",
  "\u00e2\u0080\u0099",
  "\u00e2\u0080\u009c",
  "\u00e2\u0080\u009d"
];

function isMojibake(text) {
  return MOJIBAKE_FRAGMENTS.some((fragment) => String(text || "").includes(fragment));
}

function cleanSearchText(value) {
  const text = clean(value);
  if (!text) {
    return "";
  }

  if (isMojibake(text)) {
    return "";
  }

  return text
    .replace(/[“”]/g, '"')
    .replace(/[’]/g, "'")
    .replace(/\s+/g, " ")
    .trim();
}

main();
