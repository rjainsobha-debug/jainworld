const fs = require("fs");
const path = require("path");
const { spawnSync } = require("child_process");
const { sendTelegramMessage } = require("./lib/telegram");

const rootDir = path.resolve(__dirname, "..");
const reportDir = path.join(rootDir, "tools", "reports");
const summaryJsonPath = path.join(reportDir, "daily-operations-summary.json");
const summaryTextPath = path.join(reportDir, "daily-operations-summary.txt");

const TOOL_RUNNERS = [
  {
    key: "community-directory-review-preview",
    label: "Community Directory Review Preview",
    path: path.join(rootDir, "tools", "bots", "community-directory-review-preview.js"),
    expectedOutputs: [
      path.join(rootDir, "tools", "reports", "community-directory-review-report.json"),
      path.join(rootDir, "public", "data", "review-community-directory-quality.json")
    ]
  },
  {
    key: "news-bot-preview",
    label: "News Bot Preview",
    path: path.join(rootDir, "tools", "bots", "news-bot-preview.js")
  },
  {
    key: "news-ingestion-preview",
    label: "News Ingestion Preview",
    path: path.join(rootDir, "tools", "news-ingestion-preview.js"),
    expectedOutputs: [path.join(rootDir, "public", "data", "review-news-preview.json")]
  },
  {
    key: "resources-monitor-preview",
    label: "Resources Monitor Preview",
    path: path.join(rootDir, "tools", "bots", "resources-monitor-preview.js")
  },
  {
    key: "resources-monitor-preview-root",
    label: "Resources Monitor Preview",
    path: path.join(rootDir, "tools", "resources-monitor-preview.js"),
    expectedOutputs: [path.join(rootDir, "public", "data", "review-resources-monitor-preview.json")]
  },
  {
    key: "temple-data-review-preview",
    label: "Temple Data Review Preview",
    path: path.join(rootDir, "tools", "bots", "temple-data-review-preview.js")
  },
  {
    key: "audio-permission-review-preview",
    label: "Audio Permission Review Preview",
    path: path.join(rootDir, "tools", "bots", "audio-permission-review-preview.js")
  },
  {
    key: "literature-content-gap-preview",
    label: "Literature Content Gap Preview",
    path: path.join(rootDir, "tools", "bots", "literature-content-gap-preview.js")
  },
  {
    key: "image-suggestion-preview",
    label: "Image Suggestion Preview",
    path: path.join(rootDir, "tools", "bots", "image-suggestion-preview.js")
  },
  {
    key: "marketing-content-ideas-preview",
    label: "Marketing Content Ideas Preview",
    path: path.join(rootDir, "tools", "bots", "marketing-content-ideas-preview.js")
  },
  {
    key: "search-index-refresh",
    label: "Search Index Refresh",
    path: path.join(rootDir, "tools", "bots", "search-index-refresh.js")
  },
  {
    key: "content-gap-export",
    label: "Content Gap Export",
    path: path.join(rootDir, "tools", "bots", "content-gap-export.js")
  },
  {
    key: "final-validation",
    label: "Final Validation",
    path: path.join(rootDir, "tools", "final-validation.js")
  }
];

async function main() {
  ensureDir(reportDir);
  const runTime = new Date().toISOString();
  const results = TOOL_RUNNERS.map(runTool);
  const reportsGenerated = collectGeneratedFiles(results);
  const reviewItemsCount = summarizeReviewItems(reportsGenerated);
  const summary = buildSummary(runTime, results, reportsGenerated, reviewItemsCount);

  fs.writeFileSync(summaryJsonPath, JSON.stringify(summary, null, 2), "utf8");
  fs.writeFileSync(summaryTextPath, formatTextSummary(summary), "utf8");

  printConsoleSummary(summary);
  await notifyTelegram(summary);
}

function runTool(tool) {
  if (!fs.existsSync(tool.path)) {
    return {
      key: tool.key,
      label: tool.label,
      status: "skipped",
      reason: "tool_not_found",
      script_path: relativePath(tool.path),
      generated_files: []
    };
  }

  const beforeTimes = new Map();
  (tool.expectedOutputs || []).forEach((filePath) => {
    beforeTimes.set(filePath, getMtime(filePath));
  });

  const result = spawnSync(process.execPath, [tool.path], {
    cwd: rootDir,
    encoding: "utf8",
    timeout: 120000
  });

  const generatedFiles = new Set(parseGeneratedFiles(result.stdout));
  (tool.expectedOutputs || []).forEach((filePath) => {
    const before = beforeTimes.get(filePath);
    const after = getMtime(filePath);
    if (after && (!before || after > before)) {
      generatedFiles.add(relativePath(filePath));
    }
  });

  if (result.status !== 0) {
    return {
      key: tool.key,
      label: tool.label,
      status: "failed",
      reason: sanitizeOutput(result.stderr || result.stdout || "Unknown error"),
      script_path: relativePath(tool.path),
      generated_files: [...generatedFiles]
    };
  }

  return {
    key: tool.key,
    label: tool.label,
    status: "run",
    reason: "",
    script_path: relativePath(tool.path),
    generated_files: [...generatedFiles],
    stdout: sanitizeOutput(result.stdout)
  };
}

function buildSummary(runTime, results, reportsGenerated, reviewItemsCount) {
  const toolsRun = results.filter((item) => item.status === "run");
  const toolsSkipped = results.filter((item) => item.status === "skipped");
  const toolsFailed = results.filter((item) => item.status === "failed");
  const warnings = [];

  if (toolsSkipped.length) {
    warnings.push(`${toolsSkipped.length} tool(s) were skipped because the script file does not exist yet.`);
  }
  if (toolsFailed.length) {
    warnings.push(`${toolsFailed.length} tool(s) failed and should be reviewed before the next run.`);
  }
  if (!reportsGenerated.length) {
    warnings.push("No report files were updated during this run.");
  }

  const nextActions = [];
  if (toolsFailed.length) {
    nextActions.push("Review failed tool output before using any generated reports.");
  }
  if (reportsGenerated.length) {
    nextActions.push("Inspect generated review reports before updating any public data.");
  }
  if (toolsSkipped.length) {
    nextActions.push("Add or wire missing preview scripts when those review workflows are ready.");
  }
  if (!nextActions.length) {
    nextActions.push("Review today's reports and keep all changes in review-first mode.");
  }

  return {
    run_time: runTime,
    tools_run: toolsRun.map((item) => summarizeTool(item)),
    tools_skipped: toolsSkipped.map((item) => summarizeTool(item)),
    tools_failed: toolsFailed.map((item) => summarizeTool(item)),
    generated_files: reportsGenerated,
    review_items_count: reviewItemsCount,
    warnings,
    next_actions: nextActions
  };
}

function summarizeTool(item) {
  return {
    key: item.key,
    label: item.label,
    script_path: item.script_path,
    reason: item.reason || ""
  };
}

function collectGeneratedFiles(results) {
  const files = new Set();
  results.forEach((result) => {
    (result.generated_files || []).forEach((filePath) => files.add(filePath));
  });
  files.add(relativePath(summaryJsonPath));
  files.add(relativePath(summaryTextPath));
  return [...files].sort();
}

function summarizeReviewItems(files) {
  let total = 0;

  files.forEach((relativeFile) => {
    const absoluteFile = path.join(rootDir, relativeFile);
    if (!fs.existsSync(absoluteFile) || path.extname(absoluteFile).toLowerCase() !== ".json") {
      return;
    }

    try {
      const data = JSON.parse(fs.readFileSync(absoluteFile, "utf8"));
      total += detectItemCount(data);
    } catch (error) {
      // Ignore files that are not parseable summary sources.
    }
  });

  return total;
}

function detectItemCount(data) {
  if (Array.isArray(data)) {
    return data.length;
  }
  if (data && Array.isArray(data.items)) {
    return data.items.length;
  }
  if (data && data.summary && Number.isFinite(Number(data.summary.total_records))) {
    return Number(data.summary.total_records);
  }
  return 0;
}

function formatTextSummary(summary) {
  return [
    "JainWorld Daily Operations Summary",
    `Run time: ${summary.run_time}`,
    "",
    "Tools run:",
    ...formatToolLines(summary.tools_run),
    "",
    "Tools skipped:",
    ...formatToolLines(summary.tools_skipped),
    "",
    "Tools failed:",
    ...formatToolLines(summary.tools_failed),
    "",
    "Reports generated:",
    ...formatLines(summary.generated_files),
    "",
    `Review items count: ${summary.review_items_count}`,
    "",
    "Warnings:",
    ...formatLines(summary.warnings),
    "",
    "Next actions:",
    ...formatLines(summary.next_actions),
    ""
  ].join("\n");
}

function printConsoleSummary(summary) {
  console.log("JainWorld Daily Operations Summary");
  console.log("Tools run:");
  formatToolLines(summary.tools_run).forEach((line) => console.log(line));
  console.log("Tools skipped:");
  formatToolLines(summary.tools_skipped).forEach((line) => console.log(line));
  console.log("Tools failed:");
  formatToolLines(summary.tools_failed).forEach((line) => console.log(line));
  console.log("Reports generated:");
  formatLines(summary.generated_files).forEach((line) => console.log(line));
  console.log("Next actions:");
  formatLines(summary.next_actions).forEach((line) => console.log(line));
}

async function notifyTelegram(summary) {
  const telegramText = buildTelegramSummary(summary);
  const result = await sendTelegramMessage(telegramText);

  if (result.skipped && result.reason === "env_not_configured") {
    console.log("Telegram skipped: env vars not configured");
    return;
  }

  if (result.skipped && result.reason === "dry_run") {
    console.log("Telegram dry run: message prepared but not sent");
    return;
  }

  if (!result.ok) {
    console.log(`Telegram failed: ${result.reason}`);
    return;
  }

  console.log("Telegram sent: daily review summary delivered");
}

function buildTelegramSummary(summary) {
  return [
    "JainWorld Daily Review",
    "",
    `Tools run: ${summary.tools_run.length}`,
    `Tools skipped: ${summary.tools_skipped.length}`,
    `Tools failed: ${summary.tools_failed.length}`,
    `Review items: ${summary.review_items_count}`,
    "",
    "Reports generated:",
    "- daily-operations-summary.json",
    "- daily-operations-summary.txt",
    "",
    "Next actions:",
    "- Review pending directory/resource/news/audio items",
    "- Do not publish without review",
    "",
    "No content auto-published."
  ].join("\n");
}

function formatToolLines(items) {
  if (!items.length) {
    return ["- none"];
  }

  return items.map((item) => {
    const reason = item.reason ? ` (${item.reason})` : "";
    return `- ${item.label} [${item.key}]${reason}`;
  });
}

function formatLines(items) {
  if (!items.length) {
    return ["- none"];
  }

  return items.map((item) => `- ${item}`);
}

function parseGeneratedFiles(stdout) {
  return String(stdout || "")
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line.startsWith("Wrote "))
    .map((line) => line.replace(/^Wrote\s+/, ""))
    .map((filePath) => relativePath(filePath));
}

function sanitizeOutput(text) {
  return String(text || "").replace(/\s+/g, " ").trim().slice(0, 280);
}

function ensureDir(dirPath) {
  fs.mkdirSync(dirPath, { recursive: true });
}

function getMtime(filePath) {
  if (!fs.existsSync(filePath)) {
    return 0;
  }
  return fs.statSync(filePath).mtimeMs;
}

function relativePath(filePath) {
  return path.relative(rootDir, path.resolve(filePath)).replace(/\\/g, "/");
}

main().catch((error) => {
  console.error(error.message);
  process.exitCode = 1;
});
