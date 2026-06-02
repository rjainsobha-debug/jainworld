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
No scheduling is configured yet.
No secrets are required for the default local workflow.
Telegram stays optional and inactive unless you set the env vars yourself.

Optional Telegram environment variables:

```powershell
TELEGRAM_BOT_TOKEN <set locally>
TELEGRAM_CHAT_ID <set locally>
TELEGRAM_DRY_RUN true
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
Set-Item Env:TELEGRAM_BOT_TOKEN "YOUR_TOKEN"
Set-Item Env:TELEGRAM_CHAT_ID "YOUR_CHAT_ID"
$env:TELEGRAM_DRY_RUN="false"
node .\tools\run-all-review-bots.js
```

## Local Operations Scripts

Use the PowerShell helper scripts for manual local maintenance:

```powershell
.\tools\ops\local-health-check.ps1
.\tools\ops\run-review.ps1
.\tools\ops\refresh-search-index.ps1
.\tools\ops\refresh-search-index.ps1 -Remote
.\tools\ops\deploy-checklist.ps1
.\tools\ops\clear-local-env.ps1
.\tools\ops\validate-local.ps1
```

Daily manual command:

```powershell
.\tools\ops\run-review.ps1
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

## Calendar Review Preview

Validate the trust-first Jain calendar datasets before using them in the public site:

```powershell
node .\tools\bots\calendar-review-preview.js
```

This writes:

- `tools/reports/calendar-review-report.json`
- `public/data/review-calendar-quality.json`

Calendar records are review-first.
Do not publish unsupported exact dates.
Use local sangh or trusted panchang confirmation before relying on observance dates.

## Digital Panchang Workflow

The digital Panchang workflow is source-first and review-first.

Build the 365-day skeleton if needed:

```powershell
node .\tools\bots\build-panchang-digital-skeleton.js
```

Run OCR assist only if a local OCR engine is available:

```powershell
node .\tools\bots\panchang-ocr-assist.js
```

Apply reviewed manual extraction only after human review:

```powershell
node .\tools\bots\apply-panchang-manual-extraction.js
```

Daily runner does not OCR unless `RUN_PANCHANG_OCR=true`.
Daily runner does not merge manual extraction unless `RUN_PANCHANG_MERGE=true`.

## OnlineJainPathshala Intake Preview

Dry run the public-source intake flow safely:

```powershell
node .\tools\bots\onlinejainpathshala-intake-preview.js --dry-run
node .\tools\bots\onlinejainpathshala-intake-preview.js --max-pages 150 --download-assets=false
```

This writes:

- `tools/reports/onlinejainpathshala-intake-report.json`
- `tools/exports/onlinejainpathshala-page-inventory.json`
- `tools/exports/onlinejainpathshala-page-inventory.csv`
- `public/data/review-onlinejainpathshala-pages.json`
- `public/data/review-onlinejainpathshala-assets.json`

Daily runner does not crawl this source automatically.
To allow the polite intake preview during a daily run, set:

```powershell
$env:RUN_OJP_INTAKE="true"
node .\tools\run-all-review-bots.js
```

## OnlineJainPathshala Review Preview

Validate permission, attribution, archive, extraction queue, and private-content safety:

```powershell
node .\tools\bots\onlinejainpathshala-review-preview.js
```

This writes:

- `tools/reports/onlinejainpathshala-review-report.json`
- `public/data/review-onlinejainpathshala-quality.json`

## Source and Permission Review Preview

Validate books, image credits, audio metadata, and external-resource intake records before any publishing decision:

```powershell
node .\tools\bots\source-permission-review-preview.js
```

This writes:

- `tools/reports/source-permission-review-report.json`
- `public/data/review-source-permissions.json`

## External Content Intake

- Books are metadata-first unless public-domain or permission-received status is clearly documented.
- Credit is not the same as permission.
- Use link-only or summary-only handling when rights are unclear.
- Do not host copyrighted books, PDFs, lyrics, images, or audio without verified permission.

## Principles

- No scraping
- No copyrighted media ingestion
- No invented official details
- Use review-first placeholders when verification is incomplete
- Review generated reports before making any content changes
