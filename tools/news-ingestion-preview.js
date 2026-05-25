const fs = require("fs");
const path = require("path");

const rootDir = path.resolve(__dirname, "..");
const outputPath = path.join(rootDir, "public", "data", "review-news-preview.json");
const sampleNewsPath = path.join(rootDir, "public", "data", "sample-news.json");

const SOURCES = [
  // Add safe RSS sources here for local preview, for example:
  // { name: "Google News RSS", url: "https://news.google.com/rss/search?q=Jain" }
];

const KEYWORDS = [
  "jain",
  "jainism",
  "jain temple",
  "jain muni",
  "jain sadhu",
  "jain sadhvi",
  "mahavir jayanti",
  "paryushan",
  "samvatsari",
  "das lakshan",
  "shikharji",
  "palitana",
  "digambar",
  "shwetambar",
  "jain minority",
  "jain scholarship"
];

async function main() {
  const collected = [];

  for (const source of SOURCES) {
    try {
      const items = await fetchRssPreview(source);
      collected.push(...items);
    } catch (error) {
      console.warn(`Skipping source ${source.name}: ${error.message}`);
    }
  }

  let previewItems = collected;
  if (!previewItems.length) {
    previewItems = buildFallbackPreview();
  }

  const filtered = previewItems.filter((item) => matchesKeyword(item.title_en || item.title || ""));
  const deduped = dedupeItems(filtered).map((item) => ({
    ...item,
    review_status: "pending_review",
    status: "draft"
  }));

  fs.writeFileSync(outputPath, JSON.stringify(deduped, null, 2), "utf8");
  console.log(`Wrote ${outputPath}`);
}

async function fetchRssPreview(source) {
  const response = await fetch(source.url);
  if (!response.ok) {
    throw new Error(`HTTP ${response.status}`);
  }

  const xml = await response.text();
  const items = [...xml.matchAll(/<item>([\s\S]*?)<\/item>/gi)];
  return items.map((match, index) => {
    const block = match[1];
    const title = decodeXml(getTagValue(block, "title"));
    const link = decodeXml(getTagValue(block, "link"));
    const pubDate = decodeXml(getTagValue(block, "pubDate"));
    const normalizedTitle = normalizeTitle(title);
    const contentHash = simpleHash(`${normalizedTitle} ${link}`);

    return {
      id: `news-preview-${source.name.toLowerCase().replace(/\s+/g, "-")}-${index + 1}`,
      title_en: title,
      slug: normalizedTitle.replace(/\s+/g, "-"),
      summary_en: `Preview item collected from ${source.name}. Review before publishing.`,
      source_name: source.name,
      source_url: link,
      canonical_url: link,
      published_at: pubDate || "",
      category: "General",
      region: "India",
      language: "en",
      content_hash: contentHash,
      duplicate_group_id: contentHash,
      relevance_score: scoreRelevance(title)
    };
  });
}

function buildFallbackPreview() {
  if (!fs.existsSync(sampleNewsPath)) {
    return [];
  }

  const sampleItems = JSON.parse(fs.readFileSync(sampleNewsPath, "utf8"));
  return sampleItems.slice(0, 10).map((item, index) => ({
    ...item,
    id: item.id || `news-preview-sample-${index + 1}`,
    title_en: item.title_en || item.title || "",
    summary_en: item.summary_en || item.summary || "Preview item from local sample data.",
    content_hash: item.content_hash || simpleHash(item.title_en || item.title || ""),
    duplicate_group_id: item.duplicate_group_id || simpleHash(normalizeTitle(item.title_en || item.title || "")),
    relevance_score: item.relevance_score || scoreRelevance(item.title_en || item.title || "")
  }));
}

function dedupeItems(items) {
  const seen = new Set();
  return items.filter((item) => {
    const key = item.canonical_url || item.content_hash || item.duplicate_group_id || item.id;
    if (!key || seen.has(key)) {
      return false;
    }
    seen.add(key);
    return true;
  });
}

function matchesKeyword(text) {
  const value = String(text || "").toLowerCase();
  return KEYWORDS.some((keyword) => value.includes(keyword));
}

function scoreRelevance(text) {
  const value = String(text || "").toLowerCase();
  return KEYWORDS.reduce((total, keyword) => total + (value.includes(keyword) ? 10 : 0), 0);
}

function normalizeTitle(title) {
  return String(title || "")
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function simpleHash(text) {
  const value = String(text || "");
  let hash = 0;

  for (let index = 0; index < value.length; index += 1) {
    hash = (hash << 5) - hash + value.charCodeAt(index);
    hash |= 0;
  }

  return Math.abs(hash).toString(16);
}

function getTagValue(xml, tagName) {
  const match = xml.match(new RegExp(`<${tagName}>([\\s\\S]*?)<\\/${tagName}>`, "i"));
  return match ? match[1] : "";
}

function decodeXml(value) {
  return String(value || "")
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, "$1")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'");
}

main().catch((error) => {
  console.error(error.message);
  process.exitCode = 1;
});
