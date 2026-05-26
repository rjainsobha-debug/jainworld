# JainWorld Tools

Use these local tools to prepare review-first content, search seeds, and preview reports.

## Daily Operations Runner

Run every available review-first preview bot with one command:

```powershell
node .\tools\run-all-review-bots.js
```

This command does not publish anything.
It only creates review reports and summary files.
Inspect the generated reports before updating any site content or public data.

Optional Telegram environment variables:

```powershell
TELEGRAM_BOT_TOKEN=
TELEGRAM_CHAT_ID=
TELEGRAM_DRY_RUN=true
```

Set these locally in your shell or local environment.
Do not commit a real Telegram token or chat ID.
`TELEGRAM_DRY_RUN=true` prints only and does not send a live Telegram message.

PowerShell dry run:

```powershell
$env:TELEGRAM_DRY_RUN="true"
node .\tools\run-all-review-bots.js
```

PowerShell real send:

```powershell
$env:TELEGRAM_BOT_TOKEN="YOUR_TOKEN"
$env:TELEGRAM_CHAT_ID="YOUR_CHAT_ID"
$env:TELEGRAM_DRY_RUN="false"
node .\tools\run-all-review-bots.js
```

## Search Index Seed

Rebuild the universal search seed from public JSON data:

```powershell
node .\tools\build-search-index-seed.js
```

This writes:

- `db/seed-search-index.sql`
- `db/seed-search-index-d1.sql`
- `db/seed-search-index-d1-clean.sql`

## Community Directory Review Preview

Score placeholder community-directory records for missing verification fields:

```powershell
node .\tools\bots\community-directory-review-preview.js
```

This writes:

- `tools/reports/community-directory-review-report.json`
- `public/data/review-community-directory-quality.json`

## Principles

- No scraping
- No copyrighted media ingestion
- No invented official details
- Use review-first placeholders when verification is incomplete
- Review generated reports before making any content changes
