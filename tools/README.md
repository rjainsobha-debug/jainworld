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
