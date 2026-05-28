const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

const rootDir = path.resolve(__dirname, "..", "..");
const reportPath = path.join(rootDir, "tools", "reports", "onlinejainpathshala-intake-report.json");
const inventoryJsonPath = path.join(rootDir, "tools", "exports", "onlinejainpathshala-page-inventory.json");
const inventoryCsvPath = path.join(rootDir, "tools", "exports", "onlinejainpathshala-page-inventory.csv");
const reviewPagesPath = path.join(rootDir, "public", "data", "review-onlinejainpathshala-pages.json");
const reviewAssetsPath = path.join(rootDir, "public", "data", "review-onlinejainpathshala-assets.json");
const reviewBooksPath = path.join(rootDir, "public", "data", "review-onlinejainpathshala-books.json");
const reviewAudioPath = path.join(rootDir, "public", "data", "review-onlinejainpathshala-audio.json");
const reviewImagesPath = path.join(rootDir, "public", "data", "review-onlinejainpathshala-images.json");
const reviewPathshalaPath = path.join(rootDir, "public", "data", "review-onlinejainpathshala-pathshala.json");
const reviewCalendarPath = path.join(rootDir, "public", "data", "review-onlinejainpathshala-calendar.json");

const BASE_URL = "https://www.onlinejainpathshala.com/";
const USER_AGENT = "JainWorldReviewBot/1.0 (+source review; no auto publish)";

const SECTION_CANDIDATES = [
  { section: "darshan", subsection: "about-jain-religion", url: `${BASE_URL}about-jain-religion`, content_type: "article", destination: ["literature", "education"] },
  { section: "darshan", subsection: "history-of-jainism", url: `${BASE_URL}history-of-jainism`, content_type: "article", destination: ["literature"] },
  { section: "darshan", subsection: "jain-ascetism", url: `${BASE_URL}jain-ascetism`, content_type: "article", destination: ["literature", "education"] },
  { section: "darshan", subsection: "principles-of-jainism", url: `${BASE_URL}principles-of-jainism`, content_type: "article", destination: ["education", "dictionary"] },
  { section: "darshan", subsection: "24-jain-tirthankars", url: `${BASE_URL}24-jain-tirthankars`, content_type: "article", destination: ["literature", "education", "dictionary"] },
  { section: "darshan", subsection: "bhaktamar-stotra", url: `${BASE_URL}bhaktamar-stotra`, content_type: "article", destination: ["literature", "audio"] },
  { section: "darshan", subsection: "jain-panchang", url: `${BASE_URL}jain-panchang`, content_type: "panchang", destination: ["calendar", "panchang"] },
  { section: "darshan", subsection: "jain-teethi-darpan", url: `${BASE_URL}jain-teethi-darpan`, content_type: "page", destination: ["calendar"] },
  { section: "pathshala", subsection: "pathshala-index", url: `${BASE_URL}pathshala-index`, content_type: "pathshala_lesson", destination: ["education"] },
  { section: "pathshala", subsection: "prathamaanuyog", url: `${BASE_URL}prathamaanuyog`, content_type: "pathshala_lesson", destination: ["education", "literature"] },
  { section: "pathshala", subsection: "karananuyog", url: `${BASE_URL}karananuyog`, content_type: "pathshala_lesson", destination: ["education", "literature"] },
  { section: "pathshala", subsection: "charananuyog", url: `${BASE_URL}charananuyog`, content_type: "pathshala_lesson", destination: ["education", "practice"] },
  { section: "pathshala", subsection: "dravyaanuyog", url: `${BASE_URL}dravyaanuyog`, content_type: "pathshala_lesson", destination: ["education", "philosophy"] },
  { section: "pathshala", subsection: "chahdhala", url: `${BASE_URL}chahdhala`, content_type: "pathshala_lesson", destination: ["literature", "books"] },
  { section: "pathshala", subsection: "tattvartha-sutra", url: `${BASE_URL}tattvartha-sutra`, content_type: "pathshala_lesson", destination: ["education", "books", "literature"] },
  { section: "pathshala", subsection: "kundkund-gyan-peeth", url: `${BASE_URL}kundkund-gyan-peeth`, content_type: "page", destination: ["directory", "resources"] },
  { section: "pathshala", subsection: "online-pathshala-test", url: `${BASE_URL}online-pathshala-test`, content_type: "page", destination: ["education"] },
  { section: "sangrah", subsection: "acharya-vidyasagar", url: `${BASE_URL}acharya-shri-vidyasagar-ji-maharaj`, content_type: "saint_profile", destination: ["speakers", "literature"] },
  { section: "sangrah", subsection: "acharya-sangh", url: `${BASE_URL}acharya-sangh`, content_type: "page", destination: ["speakers"] },
  { section: "sangrah", subsection: "jain-saint-jeevnee", url: `${BASE_URL}jain-saint-jeevnee`, content_type: "saint_profile", destination: ["speakers"] },
  { section: "sangrah", subsection: "jain-manuscript", url: `${BASE_URL}jain-manuscript`, content_type: "book", destination: ["books", "literature", "review"] },
  { section: "sangrah", subsection: "jain-saint-chaturmas", url: `${BASE_URL}jain-saint-chaturmas`, content_type: "page", destination: ["calendar", "speakers"] },
  { section: "sangrah", subsection: "jain-temple", url: `${BASE_URL}jain-temple`, content_type: "temple", destination: ["temples"] },
  { section: "sangrah", subsection: "jain-tirth-kshetra", url: `${BASE_URL}jain-tirth-kshetra`, content_type: "tirth", destination: ["temples", "directory"] },
  { section: "sangrah", subsection: "jain-quotations", url: `${BASE_URL}jain-quotations`, content_type: "quote", destination: ["literature"] },
  { section: "sangrah", subsection: "great-mens-view", url: `${BASE_URL}great-mens-view-on-jainism`, content_type: "quote", destination: ["literature"] },
  { section: "sangrah", subsection: "amar-granthalaya", url: `${BASE_URL}amar-granthalaya`, content_type: "page", destination: ["books", "resources", "directory"] },
  { section: "sangrah", subsection: "jain-books-literature", url: `${BASE_URL}jain-books-literature`, content_type: "book", destination: ["books"] },
  { section: "sangrah", subsection: "jain-audios", url: `${BASE_URL}jain-audios`, content_type: "audio", destination: ["audio"] },
  { section: "sangrah", subsection: "jain-videos", url: `${BASE_URL}jain-videos`, content_type: "video", destination: ["review"] },
  { section: "sangrah", subsection: "jain-images", url: `${BASE_URL}jain-images`, content_type: "image", destination: ["images", "review"] },
  { section: "sangrah", subsection: "jain-recipe", url: `${BASE_URL}jain-recipe`, content_type: "recipe", destination: ["food"] }
];

function parseArgs(argv) {
  const defaults = {
    maxPages: 150,
    dryRun: false,
    downloadAssets: false,
    section: "all"
  };

  argv.forEach((arg, index) => {
    if (arg === "--dry-run") {
      defaults.dryRun = true;
    }
    if (arg === "--max-pages" && argv[index + 1]) {
      defaults.maxPages = Number(argv[index + 1]) || defaults.maxPages;
    }
    if (arg.startsWith("--download-assets=")) {
      defaults.downloadAssets = arg.split("=")[1] === "true";
    }
    if (arg.startsWith("--section=")) {
      defaults.section = arg.split("=")[1] || "all";
    }
  });

  return defaults;
}

async function main() {
  ensureDir(path.dirname(reportPath));
  ensureDir(path.dirname(inventoryJsonPath));
  ensureDir(path.dirname(reviewPagesPath));

  const options = parseArgs(process.argv.slice(2));
  const startedAt = new Date().toISOString();
  const filtered = SECTION_CANDIDATES.filter((item) => options.section === "all" || item.section === options.section || item.subsection === options.section)
    .slice(0, Math.max(1, options.maxPages));

  const robots = await fetchRobots();
  const pageRecords = [];
  const assetRecords = [];
  const errors = [];

  for (const candidate of filtered) {
    const record = buildPageRecord(candidate, options, startedAt);

    if (!options.dryRun) {
      try {
        if (robots.allowed === false) {
          record.notes = "robots.txt could not confirm this crawl path as allowed. Manual review is required before any live crawl.";
        } else {
          const response = await timedFetch(candidate.url);
          record.http_status = response.status;
          record.notes = response.ok
            ? "Live metadata fetch succeeded. Full-text publishing still requires review."
            : `Fetch returned HTTP ${response.status}.`;
          if (response.ok) {
            const html = await response.text();
            record.title = extractTitle(html) || record.title;
            record.text_excerpt_short = extractExcerpt(html);
            record.summary_preview = record.text_excerpt_short;
            record.content_hash = sha256(html);
            assetRecords.push(...extractAssetRecords(candidate, html, options, startedAt));
          }
        }
      } catch (error) {
        record.notes = "Fetch failed. Review report preserved the failure safely.";
        errors.push({ url: candidate.url, error: String(error.message || error) });
      }
    }

    pageRecords.push(record);
  }

  const inventory = {
    generated_at: startedAt,
    base_url: BASE_URL,
    dry_run: options.dryRun,
    options,
    robots,
    pages: pageRecords
  };

  const report = {
    generated_at: startedAt,
    source_name: "Online Jain Pathshala / Amar Granthalaya",
    base_url: BASE_URL,
    dry_run: options.dryRun,
    pages_total: pageRecords.length,
    assets_total: assetRecords.length,
    fetch_errors: errors,
    robots,
    warnings: buildWarnings(options, robots, errors)
  };

  const specialized = buildSpecializedQueues(pageRecords, assetRecords);

  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2), "utf8");
  fs.writeFileSync(inventoryJsonPath, JSON.stringify(inventory, null, 2), "utf8");
  fs.writeFileSync(inventoryCsvPath, buildCsv(pageRecords), "utf8");
  fs.writeFileSync(reviewPagesPath, JSON.stringify(pageRecords, null, 2), "utf8");
  fs.writeFileSync(reviewAssetsPath, JSON.stringify(assetRecords, null, 2), "utf8");
  fs.writeFileSync(reviewBooksPath, JSON.stringify(specialized.books, null, 2), "utf8");
  fs.writeFileSync(reviewAudioPath, JSON.stringify(specialized.audio, null, 2), "utf8");
  fs.writeFileSync(reviewImagesPath, JSON.stringify(specialized.images, null, 2), "utf8");
  fs.writeFileSync(reviewPathshalaPath, JSON.stringify(specialized.pathshala, null, 2), "utf8");
  fs.writeFileSync(reviewCalendarPath, JSON.stringify(specialized.calendar, null, 2), "utf8");

  console.log(`Wrote ${reportPath}`);
  console.log(`Wrote ${inventoryJsonPath}`);
  console.log(`Wrote ${inventoryCsvPath}`);
  console.log(`Wrote ${reviewPagesPath}`);
  console.log(`Wrote ${reviewAssetsPath}`);
  console.log(`Wrote ${reviewBooksPath}`);
  console.log(`Wrote ${reviewAudioPath}`);
  console.log(`Wrote ${reviewImagesPath}`);
  console.log(`Wrote ${reviewPathshalaPath}`);
  console.log(`Wrote ${reviewCalendarPath}`);
}

async function fetchRobots() {
  try {
    const response = await timedFetch(`${BASE_URL}robots.txt`);
    if (!response.ok) {
      return { checked: true, allowed: null, status: response.status, notes: "robots.txt not readable from this environment." };
    }
    const text = await response.text();
    return {
      checked: true,
      allowed: true,
      status: response.status,
      notes: text.includes("Disallow: /") ? "robots.txt contains disallow rules. Manual review required before wider crawling." : "robots.txt fetched successfully."
    };
  } catch (error) {
    return {
      checked: false,
      allowed: null,
      status: null,
      notes: `robots.txt fetch failed: ${String(error.message || error)}`
    };
  }
}

function buildPageRecord(candidate, options, fetchedAt) {
  return {
    id: candidate.subsection,
    url: candidate.url,
    title: prettifyTitle(candidate.subsection),
    title_hi: "",
    section: candidate.section,
    subsection: candidate.subsection,
    language_detected: "unknown",
    content_type: candidate.content_type || "unknown",
    summary_preview: `Review-first discovery record for ${prettifyTitle(candidate.subsection)}.`,
    text_excerpt_short: "",
    source_name: "Online Jain Pathshala / Amar Granthalaya",
    source_url: candidate.url,
    source_site: "onlinejainpathshala.com",
    attribution_text: "Source: Online Jain Pathshala / Amar Granthalaya, Indore. Used with source credit for JainWorld review and educational reference.",
    permission_status: "needs_documented_confirmation",
    license_status: "needs_review",
    review_status: "pending_review",
    content_hash: sha256(candidate.url),
    fetched_at: fetchedAt,
    destination_mapping: candidate.destination,
    notes: options.dryRun
      ? "Dry-run seed created from known public navigation. No live content copied."
      : "Live fetch pending or completed. Manual review still required before any publishing."
  };
}

function extractAssetRecords(candidate, html, options, fetchedAt) {
  const results = [];
  const assetMatches = [...html.matchAll(/(?:src|href)=["']([^"']+\.(?:jpg|jpeg|png|webp|pdf|mp3|wav|ogg|mp4))["']/gi)];
  const seen = new Set();

  assetMatches.forEach((match, index) => {
    const rawUrl = match[1];
    const absoluteUrl = resolveUrl(rawUrl);
    if (!absoluteUrl || !absoluteUrl.startsWith(BASE_URL) || seen.has(absoluteUrl)) {
      return;
    }
    seen.add(absoluteUrl);
    const extension = path.extname(absoluteUrl).replace(".", "").toLowerCase();
    const assetType = classifyAssetType(extension);
    if ((assetType === "audio" || assetType === "video") && !options.downloadAssets) {
      return;
    }

    results.push({
      id: `${candidate.subsection}-asset-${index + 1}`,
      url: absoluteUrl,
      page_url: candidate.url,
      asset_type: assetType,
      filename: path.basename(absoluteUrl),
      extension,
      title_guess: prettifyTitle(path.basename(absoluteUrl, path.extname(absoluteUrl))),
      source_name: "Online Jain Pathshala / Amar Granthalaya",
      source_url: candidate.url,
      attribution_text: "Source: Online Jain Pathshala / Amar Granthalaya, Indore. Used with source credit for JainWorld review and educational reference.",
      permission_status: "needs_documented_confirmation",
      license_status: "needs_review",
      hosting_allowed: false,
      downloaded: false,
      local_path: null,
      review_status: "pending_review",
      content_hash: sha256(absoluteUrl),
      fetched_at: fetchedAt,
      notes: "Asset discovered from public page metadata only. No public hosting or download approval is implied."
    });
  });

  return results;
}

function buildWarnings(options, robots, errors) {
  const warnings = [];
  if (options.dryRun) {
    warnings.push("Dry run only: inventory is based on known public navigation seeds and safe metadata.");
  }
  if (robots.allowed === null) {
    warnings.push("robots.txt could not be confirmed from this environment.");
  }
  if (errors.length) {
    warnings.push(`${errors.length} fetch attempt(s) failed. Review the intake report before retrying.`);
  }
  warnings.push("Do not auto-publish reviewed pages or assets without permission and manual editorial checks.");
  return warnings;
}

function buildSpecializedQueues(pageRecords, assetRecords) {
  const books = [];
  const audio = [];
  const images = [];
  const pathshala = [];
  const calendar = [];

  pageRecords.forEach((record) => {
    const destinations = Array.isArray(record.destination_mapping) ? record.destination_mapping : [];
    if (destinations.includes("books")) {
      books.push(record);
    }
    if (destinations.includes("audio")) {
      audio.push(record);
    }
    if (destinations.includes("images")) {
      images.push(record);
    }
    if (record.section === "pathshala" || destinations.includes("education")) {
      pathshala.push(record);
    }
    if (destinations.includes("calendar") || destinations.includes("panchang")) {
      calendar.push(record);
    }
  });

  assetRecords.forEach((record) => {
    if (record.asset_type === "pdf") {
      books.push(record);
    }
    if (record.asset_type === "audio") {
      audio.push(record);
    }
    if (record.asset_type === "image") {
      images.push(record);
    }
  });

  return { books, audio, images, pathshala, calendar };
}

function buildCsv(records) {
  const headers = ["id", "url", "title", "section", "subsection", "content_type", "permission_status", "license_status", "review_status", "fetched_at"];
  const lines = [headers.join(",")];

  records.forEach((record) => {
    lines.push(headers.map((key) => csvValue(record[key])).join(","));
  });

  return lines.join("\n");
}

async function timedFetch(url) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 20000);

  try {
    return await fetch(url, {
      headers: { "User-Agent": USER_AGENT },
      signal: controller.signal
    });
  } finally {
    clearTimeout(timeout);
  }
}

function extractTitle(html) {
  const match = String(html || "").match(/<title>([^<]+)<\/title>/i);
  return match ? match[1].trim() : "";
}

function extractExcerpt(html) {
  const stripped = String(html || "")
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  return stripped.slice(0, 280);
}

function prettifyTitle(value) {
  return String(value || "")
    .replace(/[-_]+/g, " ")
    .replace(/\b\w/g, (char) => char.toUpperCase())
    .trim();
}

function resolveUrl(value) {
  try {
    return new URL(value, BASE_URL).toString();
  } catch (error) {
    return null;
  }
}

function classifyAssetType(extension) {
  if (["jpg", "jpeg", "png", "webp"].includes(extension)) {
    return "image";
  }
  if (extension === "pdf") {
    return "pdf";
  }
  if (["mp3", "wav", "ogg"].includes(extension)) {
    return "audio";
  }
  if (extension === "mp4") {
    return "video";
  }
  return "unknown";
}

function sha256(value) {
  return crypto.createHash("sha256").update(String(value || "")).digest("hex");
}

function csvValue(value) {
  const text = String(value ?? "");
  if (text.includes(",") || text.includes('"') || text.includes("\n")) {
    return `"${text.replace(/"/g, '""')}"`;
  }
  return text;
}

function ensureDir(dirPath) {
  fs.mkdirSync(dirPath, { recursive: true });
}

main().catch((error) => {
  const fallback = {
    generated_at: new Date().toISOString(),
    source_name: "Online Jain Pathshala / Amar Granthalaya",
    base_url: BASE_URL,
    pages_total: 0,
    assets_total: 0,
    warnings: ["The intake preview failed safely. Review this report before retrying."],
    error: String(error.message || error)
  };

  ensureDir(path.dirname(reportPath));
  fs.writeFileSync(reportPath, JSON.stringify(fallback, null, 2), "utf8");
  console.log(`Wrote ${reportPath}`);
  process.exitCode = 1;
});
