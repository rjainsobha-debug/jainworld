const fs = require("fs");
const path = require("path");

const rootDir = path.resolve(__dirname, "..");
const sourcePath = path.join(rootDir, "public", "data", "sample-resources.json");
const outputPath = path.join(rootDir, "public", "data", "review-resources-monitor-preview.json");
const STALE_DAYS = 90;

async function main() {
  const items = JSON.parse(fs.readFileSync(sourcePath, "utf8"));
  const checkedAt = new Date().toISOString();
  const output = [];

  for (const item of items) {
    const monitored = {
      id: item.id,
      title_en: item.title_en || "",
      slug: item.slug || item.id,
      category: item.category || "",
      official_url: item.official_url || "",
      source_name: item.source_name || "",
      last_verified_at: item.last_verified_at || "",
      checked_at: checkedAt,
      link_ok: false,
      http_status: null,
      review_status: item.review_status || "pending_review",
      needs_update: isStale(item.last_verified_at)
    };

    if (monitored.official_url) {
      const status = await checkUrl(monitored.official_url);
      monitored.link_ok = status.ok;
      monitored.http_status = status.http_status;
      if (!status.ok) {
        monitored.needs_update = true;
      }
    }

    output.push(monitored);
  }

  fs.writeFileSync(outputPath, JSON.stringify(output, null, 2), "utf8");
  console.log(`Wrote ${outputPath}`);
}

async function checkUrl(url) {
  try {
    let response = await fetch(url, { method: "HEAD", redirect: "follow" });
    if (!response.ok && [405, 403].includes(response.status)) {
      response = await fetch(url, { method: "GET", redirect: "follow" });
    }

    return {
      ok: response.ok,
      http_status: response.status
    };
  } catch (error) {
    return {
      ok: false,
      http_status: null
    };
  }
}

function isStale(lastVerifiedAt) {
  if (!lastVerifiedAt) {
    return true;
  }

  const date = new Date(lastVerifiedAt);
  if (Number.isNaN(date.getTime())) {
    return true;
  }

  const ageMs = Date.now() - date.getTime();
  return ageMs > STALE_DAYS * 24 * 60 * 60 * 1000;
}

main().catch((error) => {
  console.error(error.message);
  process.exitCode = 1;
});
